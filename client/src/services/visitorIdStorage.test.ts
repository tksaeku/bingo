import { describe, expect, it, vi } from 'vitest';
import { getVisitorId } from './visitorIdStorage';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('getVisitorId', () => {
  it('creates a UUID v4 once and stores it under bingoVisitorId', () => {
    const visitorId = getVisitorId();

    expect(visitorId).toMatch(UUID_V4);
    expect(localStorage.getItem('bingoVisitorId')).toBe(visitorId);
  });

  it('reuses the stored ID', () => {
    const first = getVisitorId();

    expect(getVisitorId()).toBe(first);
  });

  it('replaces a stored value that is not a UUID v4', () => {
    localStorage.setItem('bingoVisitorId', 'not-a-uuid');

    expect(getVisitorId()).toMatch(UUID_V4);
  });

  it('falls back to a stable in-memory ID when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const first = getVisitorId();

    expect(first).toMatch(UUID_V4);
    expect(getVisitorId()).toBe(first);
  });
});
