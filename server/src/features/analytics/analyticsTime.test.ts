import { describe, expect, it } from 'vitest';
import { getAnalyticsDay, getAnalyticsHour, getRecentDays } from './analyticsTime';

describe('analyticsTime', () => {
  describe('getAnalyticsDay and getAnalyticsHour', () => {
    it('uses the Los Angeles day around local midnight (PST)', () => {
      expect(getAnalyticsDay(new Date('2026-11-27T07:59:59.000Z'))).toBe('2026-11-26');
      expect(getAnalyticsHour(new Date('2026-11-27T07:59:59.000Z'))).toBe(23);
      expect(getAnalyticsDay(new Date('2026-11-27T08:00:00.000Z'))).toBe('2026-11-27');
      expect(getAnalyticsHour(new Date('2026-11-27T08:00:00.000Z'))).toBe(0);
    });

    it('uses the Los Angeles day around local midnight (PDT)', () => {
      expect(getAnalyticsDay(new Date('2026-07-15T06:59:59.000Z'))).toBe('2026-07-14');
      expect(getAnalyticsDay(new Date('2026-07-15T07:00:00.000Z'))).toBe('2026-07-15');
    });

    it('handles the spring-forward changeover (2026-03-08)', () => {
      expect(getAnalyticsHour(new Date('2026-03-08T09:59:00.000Z'))).toBe(1);
      expect(getAnalyticsHour(new Date('2026-03-08T10:00:00.000Z'))).toBe(3);
      expect(getAnalyticsDay(new Date('2026-03-09T06:59:59.000Z'))).toBe('2026-03-08');
      expect(getAnalyticsDay(new Date('2026-03-09T07:00:00.000Z'))).toBe('2026-03-09');
    });

    it('handles the fall-back changeover (2026-11-01)', () => {
      expect(getAnalyticsHour(new Date('2026-11-01T08:30:00.000Z'))).toBe(1);
      expect(getAnalyticsHour(new Date('2026-11-01T09:30:00.000Z'))).toBe(1);
      expect(getAnalyticsHour(new Date('2026-11-01T10:00:00.000Z'))).toBe(2);
      expect(getAnalyticsDay(new Date('2026-11-02T07:59:59.000Z'))).toBe('2026-11-01');
      expect(getAnalyticsDay(new Date('2026-11-02T08:00:00.000Z'))).toBe('2026-11-02');
    });
  });

  describe('getRecentDays', () => {
    it('returns the last N days ending today, oldest first', () => {
      expect(getRecentDays('2026-11-27', 1)).toEqual(['2026-11-27']);
      expect(getRecentDays('2026-11-27', 3)).toEqual(['2026-11-25', '2026-11-26', '2026-11-27']);
    });

    it('crosses month, year and leap-day boundaries', () => {
      expect(getRecentDays('2027-01-02', 4)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
      expect(getRecentDays('2028-03-01', 2)).toEqual(['2028-02-29', '2028-03-01']);
      expect(getRecentDays('2026-11-27', 30)).toHaveLength(30);
    });
  });
});
