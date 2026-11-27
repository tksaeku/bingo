import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry } from '../../types';
import { FakeLeaderboardRepository } from '../../testSupport/FakeLeaderboardRepository';
import { createTestApp } from '../../testSupport/createTestApp';

describe('/api/leaderboard', () => {
  describe('GET /', () => {
    it('orders by wins then most recent win, breaking ties in memory', async () => {
      const entries: LeaderboardEntry[] = [
        { id: 'old', playerName: 'Old', wins: 3, lastWin: '2026-01-01T00:00:00.000Z' },
        { id: 'new', playerName: 'New', wins: 3, lastWin: '2026-02-01T00:00:00.000Z' },
        { id: 'top', playerName: 'Top', wins: 5, lastWin: '2025-01-01T00:00:00.000Z' },
      ];
      const { app } = createTestApp({ leaderboardRepository: new FakeLeaderboardRepository(entries) });
      const response = await request(app).get('/api/leaderboard');
      expect(response.status).toBe(200);
      expect(response.body.map((entry: any) => entry.id)).toEqual(['top', 'new', 'old']);
    });

    it('returns at most 20 entries', async () => {
      const entries: LeaderboardEntry[] = Array.from({ length: 25 }, (_unused, index) => ({
        id: `p${index}`,
        playerName: `P${index}`,
        wins: index + 1,
        lastWin: '2026-01-01T00:00:00.000Z',
      }));
      const { app } = createTestApp({ leaderboardRepository: new FakeLeaderboardRepository(entries) });
      const response = await request(app).get('/api/leaderboard');
      expect(response.body).toHaveLength(20);
      expect(response.body[0].wins).toBe(25);
    });
  });

  describe('POST /', () => {
    it('creates an entry on the first win', async () => {
      const { app } = createTestApp({ getNow: () => new Date('2026-03-01T00:00:00.000Z') });
      const response = await request(app).post('/api/leaderboard').send({ playerName: 'Bob' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 'bob', playerName: 'Bob', wins: 1, lastWin: '2026-03-01T00:00:00.000Z' });
    });

    it('increments wins for names differing only in case and whitespace', async () => {
      const { app } = createTestApp();
      await request(app).post('/api/leaderboard').send({ playerName: 'Bob' });
      await request(app).post('/api/leaderboard').send({ playerName: 'bob ' });
      const response = await request(app).post('/api/leaderboard').send({ playerName: ' BOB' });
      expect(response.body).toMatchObject({ id: 'bob', playerName: 'Bob', wins: 3 });
    });

    it.each([
      ['non-string', { playerName: 42 }],
      ['empty', { playerName: '' }],
      ['whitespace only', { playerName: '   ' }],
      ['too long', { playerName: 'x'.repeat(21) }],
      ['missing', {}],
    ])('returns 400 for %s name', async (_label, body) => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/leaderboard').send(body);
      expect(response.status).toBe(400);
    });

    it('returns 400 for a name with a lone surrogate instead of 500', async () => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/leaderboard').send({ playerName: 'bad\uDC00' });
      expect(response.status).toBe(400);
    });

    it('applies the length limit after collapsing whitespace', async () => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/leaderboard').send({ playerName: `${'a'.repeat(10)}${' '.repeat(30)}${'b'.repeat(9)}` });
      expect(response.status).toBe(200);
      expect(response.body.playerName).toBe(`${'a'.repeat(10)} ${'b'.repeat(9)}`);
    });

    it('returns 429 after 10 submissions per minute', async () => {
      const { app } = createTestApp();
      let lastStatus = 0;
      for (let attempt = 0; attempt < 11; attempt += 1) {
        const response = await request(app).post('/api/leaderboard').send({ playerName: 'Bob' });
        lastStatus = response.status;
      }
      expect(lastStatus).toBe(429);
    });
  });
});
