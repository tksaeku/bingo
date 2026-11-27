import { describe, expect, it } from 'vitest';
import { formatClockTime, formatCount, formatDay, formatHour, getPercent } from './statsFormat';

describe('statsFormat', () => {
  describe('getPercent', () => {
    it('rounds to a whole percent', () => {
      expect(getPercent(1, 3)).toBe(33);
      expect(getPercent(2, 3)).toBe(67);
    });

    it('is 0 when the total is 0', () => {
      expect(getPercent(0, 0)).toBe(0);
    });
  });

  it('formats thousands separators', () => {
    expect(formatCount(2210)).toBe('2,210');
  });

  it('formats hours on a 12-hour clock', () => {
    expect([0, 1, 11, 12, 13, 23].map(formatHour)).toEqual(['12 AM', '1 AM', '11 AM', '12 PM', '1 PM', '11 PM']);
  });

  it('formats a day without shifting it across time zones', () => {
    expect(formatDay('2026-11-26')).toBe('Thu, Nov 26');
    expect(formatDay('2026-12-01')).toBe('Tue, Dec 1');
  });

  it('formats a timestamp in the given zone', () => {
    expect(formatClockTime('2026-11-26T19:04:11.000Z', 'America/Los_Angeles')).toBe('11:04 AM');
  });
});
