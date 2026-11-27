import { Timestamp, type DocumentData } from 'firebase-admin/firestore';

type RawDocuments = Map<string, DocumentData>;

type Converter = {
  toFirestore: (model: any) => DocumentData;
  fromFirestore: (snapshot: any) => any;
};

function toComparable(value: unknown): number | string {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  return typeof value === 'number' ? value : String(value);
}

/** Document snapshot returned by reads; `data()` applies the collection's converter. */
export class FakeDocumentSnapshot {
  readonly id: string;
  readonly exists: boolean;
  readonly ref: FakeDocumentReference;
  readonly #raw: DocumentData | undefined;
  readonly #converter: Converter | undefined;

  constructor(ref: FakeDocumentReference, raw: DocumentData | undefined, converter: Converter | undefined) {
    this.id = ref.id;
    this.exists = raw !== undefined;
    this.ref = ref;
    this.#raw = raw;
    this.#converter = converter;
  }

  data(): any {
    if (this.#raw === undefined) {
      return undefined;
    }
    return this.#converter ? this.#converter.fromFirestore({ id: this.id, data: () => this.#raw }) : this.#raw;
  }
}

/** Reference to one document within a fake collection. */
export class FakeDocumentReference {
  readonly id: string;
  readonly collection: FakeCollectionReference;

  constructor(collection: FakeCollectionReference, id: string) {
    this.id = id;
    this.collection = collection;
  }
}

/** Query over a fake collection supporting orderBy, limit and get. */
export class FakeQuery {
  protected readonly collection: FakeCollectionReference;
  readonly #orderField: string | undefined;
  readonly #direction: 'asc' | 'desc';
  readonly #limitCount: number | undefined;

  constructor(collection: FakeCollectionReference, orderField?: string, direction: 'asc' | 'desc' = 'asc', limitCount?: number) {
    this.collection = collection;
    this.#orderField = orderField;
    this.#direction = direction;
    this.#limitCount = limitCount;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): FakeQuery {
    return new FakeQuery(this.collection, field, direction, this.#limitCount);
  }

  limit(count: number): FakeQuery {
    return new FakeQuery(this.collection, this.#orderField, this.#direction, count);
  }

  /** Resolves the query without a transaction (recorded as a non-transactional read). */
  async get(): Promise<{ docs: FakeDocumentSnapshot[]; size: number }> {
    this.collection.database.log.push('read');
    return this.execute();
  }

  execute(): { docs: FakeDocumentSnapshot[]; size: number } {
    const field = this.#orderField;
    let docs = [...this.collection.rawDocuments.entries()].map(
      ([id, raw]) => new FakeDocumentSnapshot(new FakeDocumentReference(this.collection, id), raw, this.collection.converter),
    );
    if (field !== undefined) {
      const sign = this.#direction === 'desc' ? -1 : 1;
      const rawOf = (snapshot: FakeDocumentSnapshot): unknown => this.collection.rawDocuments.get(snapshot.id)?.[field];
      docs = docs.sort((first, second) => {
        const a = toComparable(rawOf(first));
        const b = toComparable(rawOf(second));
        return a < b ? -sign : a > b ? sign : 0;
      });
    }
    if (this.#limitCount !== undefined) {
      docs = docs.slice(0, this.#limitCount);
    }
    return { docs, size: docs.length };
  }
}

/** Minimal in-memory stand-in for a Firestore collection reference. */
export class FakeCollectionReference extends FakeQuery {
  readonly database: FakeFirestore;
  readonly name: string;
  readonly converter: Converter | undefined;

  constructor(database: FakeFirestore, name: string, converter?: Converter) {
    super(undefined as unknown as FakeCollectionReference);
    this.database = database;
    this.name = name;
    this.converter = converter;
  }

  get rawDocuments(): RawDocuments {
    return this.database.getRawDocuments(this.name);
  }

  withConverter(converter: Converter): FakeCollectionReference {
    return new FakeCollectionReference(this.database, this.name, converter);
  }

  doc(id?: string): FakeDocumentReference {
    return new FakeDocumentReference(this, id ?? `auto-${this.name}-${this.database.nextAutoId()}`);
  }

  override orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): FakeQuery {
    return new FakeQuery(this, field, direction);
  }

  override limit(count: number): FakeQuery {
    return new FakeQuery(this, undefined, 'asc', count);
  }

  override async get(): Promise<{ docs: FakeDocumentSnapshot[]; size: number }> {
    this.database.log.push('read');
    return new FakeQuery(this).execute();
  }
}

type PendingWrite = { kind: 'set'; ref: FakeDocumentReference; value: unknown } | { kind: 'delete'; ref: FakeDocumentReference };

function applyWrite(write: PendingWrite): void {
  const documents = write.ref.collection.rawDocuments;
  if (write.kind === 'delete') {
    documents.delete(write.ref.id);
    return;
  }
  const converter = write.ref.collection.converter;
  documents.set(write.ref.id, converter ? converter.toFirestore(write.value) : (write.value as DocumentData));
}

/** Transaction that, like Firestore, rejects reads issued after a write. */
export class FakeTransaction {
  readonly #database: FakeFirestore;
  readonly #writes: PendingWrite[] = [];

  constructor(database: FakeFirestore) {
    this.#database = database;
  }

  async get(target: FakeDocumentReference | FakeQuery): Promise<any> {
    if (this.#writes.length > 0) {
      throw new Error('Firestore transactions require all reads to be executed before all writes.');
    }
    this.#database.log.push('tx:get');
    if (target instanceof FakeDocumentReference) {
      return new FakeDocumentSnapshot(target, target.collection.rawDocuments.get(target.id), target.collection.converter);
    }
    return target instanceof FakeCollectionReference ? new FakeQuery(target).execute() : target.execute();
  }

  set(ref: FakeDocumentReference, value: unknown): this {
    this.#database.log.push('tx:set');
    this.#writes.push({ kind: 'set', ref, value });
    return this;
  }

  delete(ref: FakeDocumentReference): this {
    this.#database.log.push('tx:delete');
    this.#writes.push({ kind: 'delete', ref });
    return this;
  }

  commit(): void {
    this.#writes.forEach(applyWrite);
  }
}

/** Write batch; commits are recorded with their operation count. */
export class FakeWriteBatch {
  readonly #database: FakeFirestore;
  readonly #writes: PendingWrite[] = [];

  constructor(database: FakeFirestore) {
    this.#database = database;
  }

  set(ref: FakeDocumentReference, value: unknown): this {
    this.#writes.push({ kind: 'set', ref, value });
    return this;
  }

  delete(ref: FakeDocumentReference): this {
    this.#writes.push({ kind: 'delete', ref });
    return this;
  }

  async commit(): Promise<void> {
    this.#database.batchSizes.push(this.#writes.length);
    this.#writes.forEach(applyWrite);
  }
}

/**
 * Hand-rolled in-memory Firestore: collections, docs, queries, transactions
 * and batches. `log` records every read/write so tests can assert ordering.
 */
export class FakeFirestore {
  readonly log: string[] = [];
  readonly batchSizes: number[] = [];
  transactionCount = 0;
  readonly #collections = new Map<string, RawDocuments>();
  #autoId = 0;

  getRawDocuments(name: string): RawDocuments {
    const existing = this.#collections.get(name);
    if (existing) {
      return existing;
    }
    const created: RawDocuments = new Map();
    this.#collections.set(name, created);
    return created;
  }

  nextAutoId(): number {
    this.#autoId += 1;
    return this.#autoId;
  }

  collection(name: string): FakeCollectionReference {
    return new FakeCollectionReference(this, name);
  }

  batch(): FakeWriteBatch {
    return new FakeWriteBatch(this);
  }

  async runTransaction<Result>(update: (transaction: FakeTransaction) => Promise<Result>): Promise<Result> {
    this.transactionCount += 1;
    const transaction = new FakeTransaction(this);
    const result = await update(transaction);
    transaction.commit();
    this.log.push('tx:commit');
    return result;
  }

  /** Seeds raw documents (as stored in Firestore) into a collection. */
  seed(name: string, documents: Record<string, DocumentData>): void {
    Object.entries(documents).forEach(([id, raw]) => this.getRawDocuments(name).set(id, raw));
  }
}
