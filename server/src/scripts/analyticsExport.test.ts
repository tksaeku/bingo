import { describe, expect, it } from 'vitest';
import type { AnalyticsBatchRecord } from '../types';
import { flattenBatches, getIsExportAllowed, parseExportArguments, toJsonLines } from './analyticsExport';

describe('analyticsExport', () => {
  describe('parseExportArguments', () => {
    it('parses the range, an output path and the confirmation flag', () => {
      expect(parseExportArguments(['--from', '2026-11-20', '--to', '2026-11-27', '--out', 'out.jsonl', '--yes'])).toEqual({
        fromDay: '2026-11-20',
        toDay: '2026-11-27',
        outputPath: 'out.jsonl',
        isConfirmed: true,
      });
    });

    it('defaults the output path and leaves the run unconfirmed', () => {
      expect(parseExportArguments(['--from', '2026-11-20', '--to', '2026-11-20'])).toEqual({
        fromDay: '2026-11-20',
        toDay: '2026-11-20',
        outputPath: 'analytics-2026-11-20_2026-11-20.jsonl',
        isConfirmed: false,
      });
    });

    it.each([
      [[]],
      [['--from', '2026-11-20']],
      [['--to', '2026-11-20']],
      [['--from', '--to', '2026-11-20']],
      [['--from', '2026-11-2', '--to', '2026-11-20']],
      [['--from', '2026-02-30', '--to', '2026-03-01']],
      [['--from', '2026-11-21', '--to', '2026-11-20']],
    ])('throws for %j', (argv) => {
      expect(() => parseExportArguments(argv)).toThrow();
    });
  });

  describe('getIsExportAllowed', () => {
    it('allows the emulator or an explicit --yes, and refuses a real project otherwise', () => {
      expect(getIsExportAllowed(true, false)).toBe(true);
      expect(getIsExportAllowed(false, true)).toBe(true);
      expect(getIsExportAllowed(false, false)).toBe(false);
    });
  });

  describe('flattenBatches and toJsonLines', () => {
    const batches: AnalyticsBatchRecord[] = [
      {
        visitorId: 'v1',
        day: '2026-11-27',
        receivedAt: '2026-11-27T20:00:10.000Z',
        deviceType: 'mobile',
        expireAt: '2026-12-27T20:00:10.000Z',
        events: [
          { name: 'page_view', properties: { route: 'play' }, occurredAt: '2026-11-27T20:00:05.000Z' },
          { name: 'board_started', occurredAt: '2026-11-27T20:00:01.000Z' },
        ],
      },
      {
        visitorId: 'v2',
        day: '2026-11-27',
        receivedAt: '2026-11-27T20:00:12.000Z',
        deviceType: 'desktop',
        expireAt: '2026-12-27T20:00:12.000Z',
        events: [{ name: 'bingo', occurredAt: '2026-11-27T20:00:03.000Z' }],
      },
    ];

    it('flattens batch fields onto each event, ordered by occurrence, without expireAt', () => {
      const events = flattenBatches(batches);
      expect(events.map((event) => event.name)).toEqual(['board_started', 'bingo', 'page_view']);
      expect(events[2]).toEqual({
        visitorId: 'v1',
        day: '2026-11-27',
        receivedAt: '2026-11-27T20:00:10.000Z',
        deviceType: 'mobile',
        name: 'page_view',
        properties: { route: 'play' },
        occurredAt: '2026-11-27T20:00:05.000Z',
      });
      expect(events[0]).not.toHaveProperty('properties');
      expect(events[0]).not.toHaveProperty('expireAt');
    });

    it('writes one JSON line per event', () => {
      const lines = toJsonLines(flattenBatches(batches)).split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[3]).toBe('');
      expect(JSON.parse(lines[1])).toMatchObject({ name: 'bingo', visitorId: 'v2' });
      expect(toJsonLines([])).toBe('');
    });
  });
});
