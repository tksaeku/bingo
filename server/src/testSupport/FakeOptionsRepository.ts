import type { CreateOptionResult, OptionsRepository } from '../repositories/repositoryTypes';
import type { Option } from '../types';
import { getOptionDedupeKey } from '../utils/normalize';

const BASE_TIME = Date.parse('2026-01-01T00:00:00.000Z');

/** In-memory options store mirroring the Firestore repository's semantics. */
export class FakeOptionsRepository implements OptionsRepository {
  readonly options: Option[];
  #nextIdNumber: number;

  constructor(initialTexts: readonly string[] = []) {
    this.options = initialTexts.map((text, index) => ({
      id: `seed-${index}`,
      text,
      createdAt: new Date(BASE_TIME + index * 1000).toISOString(),
    }));
    this.#nextIdNumber = initialTexts.length;
  }

  async listOptions(): Promise<Option[]> {
    return [...this.options].sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
  }

  async createUniqueOption(input: { text: string; maxOptions: number }): Promise<CreateOptionResult> {
    const dedupeKey = getOptionDedupeKey(input.text);
    if (this.options.some((option) => getOptionDedupeKey(option.text) === dedupeKey)) {
      return { status: 'duplicate' };
    }
    if (this.options.length >= input.maxOptions) {
      return { status: 'full' };
    }
    const option: Option = {
      id: `option-${this.#nextIdNumber}`,
      text: input.text,
      createdAt: new Date(BASE_TIME + this.#nextIdNumber * 1000).toISOString(),
    };
    this.#nextIdNumber += 1;
    this.options.push(option);
    return { status: 'created', option };
  }

  async deleteOption(id: string): Promise<boolean> {
    const index = this.options.findIndex((option) => option.id === id);
    if (index === -1) {
      return false;
    }
    this.options.splice(index, 1);
    return true;
  }
}
