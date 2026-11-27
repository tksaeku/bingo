import { describe, expect, it } from 'vitest';
import { FakeOptionsRepository } from '../../testSupport/FakeOptionsRepository';
import { createOptionsService } from './optionsService';

describe('optionsService', () => {
  describe('addOption', () => {
    it('collapses whitespace before storing', async () => {
      const service = createOptionsService(new FakeOptionsRepository());
      const option = await service.addOption('  Gold   costume ');
      expect(option.text).toBe('Gold costume');
    });

    it('rejects case-insensitive duplicates with 409', async () => {
      const service = createOptionsService(new FakeOptionsRepository(['Gold costume']));
      await expect(service.addOption('GOLD COSTUME')).rejects.toMatchObject({ status: 409 });
    });

    it('accepts additions to a pool of any size', async () => {
      const texts = Array.from({ length: 250 }, (_unused, index) => `Option ${index}`);
      const service = createOptionsService(new FakeOptionsRepository(texts));
      const option = await service.addOption('One more');
      expect(option.text).toBe('One more');
    });
  });

  describe('removeOption', () => {
    it('rejects unknown ids with 404', async () => {
      const service = createOptionsService(new FakeOptionsRepository());
      await expect(service.removeOption('missing')).rejects.toMatchObject({ status: 404 });
    });
  });
});
