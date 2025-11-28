import { getCollection } from '../services/firestore';

type RawOption = {
  text: string;
  createdAt: any;
};

const collection = getCollection('options');

class Query {
  private col: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  private orders: Array<[string, FirebaseFirestore.OrderByDirection]> = [];
  private _limit?: number;

  constructor(col: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>) {
    this.col = col;
  }

  sort(spec: Record<string, number>) {
    for (const [key, dir] of Object.entries(spec)) {
      this.orders.push([key, dir === -1 ? 'desc' : 'asc']);
    }
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
    return (async () => {
      let q: FirebaseFirestore.Query = this.col;
      for (const [field, dir] of this.orders) {
        q = q.orderBy(field, dir);
      }
      if (this._limit) q = q.limit(this._limit);
      const snap = await q.get();
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as RawOption) }));
    })().then(onFulfilled, onRejected);
  }
}

export default class Option {
  id?: string;
  text: string;
  createdAt: Date;

  constructor(data: { id?: string; text: string; createdAt?: any }) {
    this.id = data.id;
    this.text = data.text;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }

  async save() {
    if (this.id) {
      await collection.doc(this.id).set({ text: this.text, createdAt: this.createdAt }, { merge: true });
      return this;
    }
    const docRef = await collection.add({ text: this.text, createdAt: this.createdAt });
    this.id = docRef.id;
    return this;
  }

  static find() {
    return new Query(collection);
  }

  static async findOne(filter: Record<string, any>) {
    let q: FirebaseFirestore.Query = collection;
    for (const [k, v] of Object.entries(filter || {})) {
      q = q.where(k, '==', v);
    }
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data() as RawOption;
    return new Option({ id: d.id, text: data.text, createdAt: data.createdAt });
  }

  static async findByIdAndDelete(id: string) {
    const doc = await collection.doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() as RawOption;
    await collection.doc(id).delete();
    return new Option({ id: doc.id, text: data.text, createdAt: data.createdAt });
  }

  static async deleteMany() {
    const snap = await collection.get();
    const batch = collection.firestore.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  static async insertMany(items: Array<{ text: string }>) {
    const batch = collection.firestore.batch();
    const refs: Array<any> = [];
    items.forEach(item => {
      const ref = collection.doc();
      batch.set(ref, { text: item.text, createdAt: new Date() });
      refs.push(ref);
    });
    await batch.commit();
    return refs.map(r => ({ id: r.id }));
  }
}
