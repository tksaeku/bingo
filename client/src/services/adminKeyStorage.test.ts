import { describe, expect, it, vi } from 'vitest';
import {
  clearStoredAdminKey,
  getStoredAdminKey,
  storeAdminKey,
  subscribeToAdminKey,
} from './adminKeyStorage';

describe('adminKeyStorage', () => {
  describe('storing and clearing', () => {
    it('stores, reads, and clears the key', () => {
      expect(getStoredAdminKey()).toBeNull();
      storeAdminKey('secret');
      expect(getStoredAdminKey()).toBe('secret');
      clearStoredAdminKey();
      expect(getStoredAdminKey()).toBeNull();
    });

    it('notifies subscribers until they unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToAdminKey(listener);

      storeAdminKey('secret');
      clearStoredAdminKey();
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      storeAdminKey('again');
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('when Storage throws', () => {
    it('reads as no key and writes do not throw', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const listener = vi.fn();
      const unsubscribe = subscribeToAdminKey(listener);

      expect(getStoredAdminKey()).toBeNull();
      expect(() => storeAdminKey('secret')).not.toThrow();
      expect(() => clearStoredAdminKey()).not.toThrow();
      expect(listener).toHaveBeenCalledTimes(2);
      unsubscribe();
    });
  });
});
