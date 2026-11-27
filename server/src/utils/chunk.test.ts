import { describe, expect, it } from 'vitest';
import { chunk } from './chunk';

describe('chunk', () => {
  it('splits into groups of at most the size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns no chunks for empty input', () => {
    expect(chunk([], 500)).toEqual([]);
  });

  it('rejects sizes below one', () => {
    expect(() => chunk([1], 0)).toThrow();
  });
});
