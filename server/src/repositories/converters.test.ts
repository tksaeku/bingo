import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { leaderboardConverter, optionConverter, timestampToIso } from './converters';

describe('timestampToIso', () => {
  it('converts a Firestore Timestamp to ISO', () => {
    expect(timestampToIso(Timestamp.fromDate(new Date('2026-01-02T03:04:05.678Z')))).toBe('2026-01-02T03:04:05.678Z');
  });

  it('converts a Date and an ISO string', () => {
    expect(timestampToIso(new Date('2026-01-02T00:00:00.000Z'))).toBe('2026-01-02T00:00:00.000Z');
    expect(timestampToIso('2026-01-02T00:00:00Z')).toBe('2026-01-02T00:00:00.000Z');
  });

  it('falls back to the epoch for missing or invalid values', () => {
    expect(timestampToIso(undefined)).toBe('1970-01-01T00:00:00.000Z');
    expect(timestampToIso('garbage')).toBe('1970-01-01T00:00:00.000Z');
  });
});

describe('optionConverter', () => {
  it('writes text and a Timestamp without the id', () => {
    const written: any = optionConverter.toFirestore({ id: 'a', text: 'Hi', createdAt: '2026-01-02T03:04:05.000Z' });
    expect(Object.keys(written).sort()).toEqual(['createdAt', 'text']);
    expect(written.createdAt).toBeInstanceOf(Timestamp);
    expect(written.createdAt.toDate().toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('reads a snapshot into an Option with an ISO createdAt', () => {
    const snapshot: any = { id: 'doc1', data: () => ({ text: 'Hi', createdAt: Timestamp.fromDate(new Date('2026-01-02T03:04:05.000Z')) }) };
    expect(optionConverter.fromFirestore(snapshot)).toEqual({ id: 'doc1', text: 'Hi', createdAt: '2026-01-02T03:04:05.000Z' });
  });
});

describe('leaderboardConverter', () => {
  it('round-trips wins and lastWin', () => {
    const written: any = leaderboardConverter.toFirestore({ id: 'bob', playerName: 'Bob', wins: 3, lastWin: '2026-02-01T00:00:00.000Z' });
    expect(written).toMatchObject({ playerName: 'Bob', wins: 3 });
    const snapshot: any = { id: 'bob', data: () => written };
    expect(leaderboardConverter.fromFirestore(snapshot)).toEqual({ id: 'bob', playerName: 'Bob', wins: 3, lastWin: '2026-02-01T00:00:00.000Z' });
  });

  it('defaults malformed stored fields', () => {
    const snapshot: any = { id: 'x', data: () => ({}) };
    expect(leaderboardConverter.fromFirestore(snapshot)).toEqual({ id: 'x', playerName: '', wins: 0, lastWin: '1970-01-01T00:00:00.000Z' });
  });
});
