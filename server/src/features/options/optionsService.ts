import { MAX_OPTIONS } from '../../constants';
import { HttpError } from '../../HttpError';
import type { OptionsRepository } from '../../repositories/repositoryTypes';
import type { Option } from '../../types';
import { collapseWhitespace } from '../../utils/normalize';

export type OptionsService = {
  listOptions: () => Promise<Option[]>;
  addOption: (text: string) => Promise<Option>;
  removeOption: (id: string) => Promise<void>;
};

/**
 * Creates the options service: owns duplicate and pool-size rules on top of
 * the repository's atomic primitives.
 */
export function createOptionsService(repository: OptionsRepository): OptionsService {
  return {
    listOptions: (): Promise<Option[]> => repository.listOptions(),

    async addOption(text: string): Promise<Option> {
      const result = await repository.createUniqueOption({ text: collapseWhitespace(text), maxOptions: MAX_OPTIONS });
      if (result.status === 'duplicate') {
        throw new HttpError(409, 'Option already exists');
      }
      if (result.status === 'full') {
        throw new HttpError(422, `Option pool is full (max ${MAX_OPTIONS})`);
      }
      return result.option;
    },

    async removeOption(id: string): Promise<void> {
      const wasDeleted = await repository.deleteOption(id);
      if (!wasDeleted) {
        throw new HttpError(404, 'Option not found');
      }
    },
  };
}
