import { OPTIONS_COLLECTION, FIRESTORE_BATCH_LIMIT } from '../constants';
import { getDatabase } from '../services/firestore';
import type { Option } from '../types';
import { chunk } from '../utils/chunk';
import { getOptionDedupeKey } from '../utils/normalize';
import { optionConverter } from './converters';
import type { CreateOptionResult, OptionsRepository } from './repositoryTypes';

/** Firestore-backed options store. */
export class FirestoreOptionsRepository implements OptionsRepository {
  /** Typed collection reference with the option converter. */
  #getCollection(): FirebaseFirestore.CollectionReference<Option> {
    return getDatabase().collection(OPTIONS_COLLECTION).withConverter(optionConverter);
  }

  /** Lists every option ordered by createdAt ascending. */
  async listOptions(): Promise<Option[]> {
    const snapshot = await this.#getCollection().orderBy('createdAt', 'asc').get();
    return snapshot.docs.map((document) => document.data());
  }

  /** Inserts an option in one transaction: reads the pool, rejects duplicates and a full pool, then writes. */
  async createUniqueOption(input: { text: string; maxOptions: number }): Promise<CreateOptionResult> {
    const collection = this.#getCollection();
    const dedupeKey = getOptionDedupeKey(input.text);

    return getDatabase().runTransaction(async (transaction): Promise<CreateOptionResult> => {
      const snapshot = await transaction.get(collection);
      const isDuplicate = snapshot.docs.some((document) => getOptionDedupeKey(document.data().text) === dedupeKey);
      if (isDuplicate) {
        return { status: 'duplicate' };
      }
      if (snapshot.size >= input.maxOptions) {
        return { status: 'full' };
      }
      const reference = collection.doc();
      const option: Option = { id: reference.id, text: input.text, createdAt: new Date().toISOString() };
      transaction.set(reference, option);
      return { status: 'created', option };
    });
  }

  /** Deletes an option in a transaction; resolves false when it does not exist. */
  async deleteOption(id: string): Promise<boolean> {
    const reference = this.#getCollection().doc(id);
    return getDatabase().runTransaction(async (transaction): Promise<boolean> => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        return false;
      }
      transaction.delete(reference);
      return true;
    });
  }

  /** Deletes every option in batches of at most 500. Used by the seed script. */
  async deleteAllOptions(): Promise<number> {
    const snapshot = await this.#getCollection().get();
    for (const documents of chunk(snapshot.docs, FIRESTORE_BATCH_LIMIT)) {
      const batch = getDatabase().batch();
      documents.forEach((document) => batch.delete(document.ref));
      await batch.commit();
    }
    return snapshot.size;
  }

  /** Inserts options in batches of at most 500, preserving order via createdAt. Used by the seed script. */
  async insertOptions(texts: readonly string[]): Promise<number> {
    const collection = this.#getCollection();
    const startTime = Date.now();
    const options: Option[] = texts.map((text, index) => ({
      id: collection.doc().id,
      text,
      createdAt: new Date(startTime + index).toISOString(),
    }));
    for (const group of chunk(options, FIRESTORE_BATCH_LIMIT)) {
      const batch = getDatabase().batch();
      group.forEach((option) => batch.set(collection.doc(option.id), option));
      await batch.commit();
    }
    return options.length;
  }
}
