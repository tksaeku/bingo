import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR } from '../../constants';
import { createTestApp, TEST_ADMIN_KEY } from '../../testSupport/createTestApp';

const BROWSER_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const NOW = new Date('2026-11-27T20:15:00.000Z');

function batch(visitorId: string = randomUUID(), events: unknown[] = [{ name: 'board_started', offsetMs: 1000 }]): { visitorId: string; events: unknown[] } {
  return { visitorId, events };
}

describe('/api/analytics/events', () => {
  describe('POST /', () => {
    it('returns 204 and stores the batch, bucketed by server time', async () => {
      const { app, analyticsRepository } = createTestApp({ getNow: () => NOW });
      const visitorId = randomUUID();
      const response = await request(app)
        .post('/api/analytics/events')
        .set('User-Agent', BROWSER_UA)
        .send(batch(visitorId, [{ name: 'page_view', offsetMs: 0, properties: { route: 'play' } }, { name: 'first_mark', offsetMs: 4000 }]));
      expect(response.status).toBe(204);
      expect(analyticsRepository.batches).toHaveLength(1);
      const stored = analyticsRepository.batches[0];
      expect(stored).toMatchObject({ visitorId, day: '2026-11-27', deviceType: 'mobile', receivedAt: NOW.toISOString() });
      expect(stored.events.map((event) => event.name)).toEqual(['first_mark', 'page_view']);
      expect(stored.events[0].occurredAt).toBe('2026-11-27T20:14:56.000Z');
      expect(stored.events[1].properties).toEqual({ route: 'play' });
      expect(JSON.stringify(stored)).not.toContain('Mozilla');
    });

    it('uses the Los Angeles day for the bucket', async () => {
      const { app, analyticsRepository } = createTestApp({ getNow: () => new Date('2026-11-28T03:00:00.000Z') });
      await request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA).send(batch());
      expect(analyticsRepository.batches[0].day).toBe('2026-11-27');
      expect(analyticsRepository.counters.get('2026-11-27')?.hourly[19]).toBe(1);
    });

    it.each([['no User-Agent', undefined], ['a bot User-Agent', 'Googlebot/2.1']])('returns 204 and stores nothing for %s', async (_label, userAgent) => {
      const { app, analyticsRepository } = createTestApp();
      const agent = request(app).post('/api/analytics/events');
      if (userAgent !== undefined) {
        agent.set('User-Agent', userAgent);
      } else {
        agent.unset('User-Agent');
      }
      const response = await agent.send(batch());
      expect(response.status).toBe(204);
      expect(analyticsRepository.batches).toHaveLength(0);
    });

    it('returns 400 for an invalid batch and stores nothing', async () => {
      const { app, analyticsRepository } = createTestApp();
      const response = await request(app)
        .post('/api/analytics/events')
        .set('User-Agent', DESKTOP_UA)
        .send(batch(randomUUID(), [{ name: 'board_started', offsetMs: 1 }, { name: 'nope', offsetMs: 1 }]));
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
      expect(analyticsRepository.batches).toHaveLength(0);
    });

    it('returns 400 for a missing body', async () => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA);
      expect(response.status).toBe(400);
    });

    it('returns 410 with nothing stored when collection is off, before validation', async () => {
      const { app, analyticsRepository } = createTestApp({ analyticsEnabled: false });
      const valid = await request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA).send(batch());
      const invalid = await request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA).send({ nonsense: true });
      expect(valid.status).toBe(410);
      expect(valid.body).toEqual({ error: 'Analytics collection is off' });
      expect(invalid.status).toBe(410);
      expect(analyticsRepository.batches).toHaveLength(0);
    });

    it('returns 413 for a body over 10 kb', async () => {
      const { app } = createTestApp();
      const response = await request(app)
        .post('/api/analytics/events')
        .set('User-Agent', DESKTOP_UA)
        .send({ visitorId: randomUUID(), events: [], padding: 'x'.repeat(11_000) });
      expect(response.status).toBe(413);
    });

    it('returns 429 once a visitor exceeds 20 requests per minute', async () => {
      const { app, analyticsRepository } = createTestApp();
      const visitorId = randomUUID();
      const statuses: number[] = [];
      for (let requestIndex = 0; requestIndex < 21; requestIndex += 1) {
        statuses.push((await request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA).send(batch(visitorId))).status);
      }
      expect(statuses.slice(0, 20).every((status) => status === 204)).toBe(true);
      expect(statuses[20]).toBe(429);
      expect(analyticsRepository.batches).toHaveLength(20);
    });

    it('limits an IP across different visitors to 600 requests per minute', async () => {
      const { app, analyticsRepository } = createTestApp();
      const send = (): Promise<request.Response> => request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA).send(batch());
      const responses = await Promise.all(Array.from({ length: 601 }, send));
      expect(responses.filter((response) => response.status === 204)).toHaveLength(600);
      expect(responses.filter((response) => response.status === 429)).toHaveLength(1);
      expect(analyticsRepository.batches).toHaveLength(600);
    });

    it('returns 429 and stores nothing past the visitor daily event cap', async () => {
      const { app, analyticsRepository } = createTestApp({ getNow: () => NOW });
      const visitorId = randomUUID();
      const events = Array.from({ length: 20 }, () => ({ name: 'play_again' as const, occurredAt: NOW.toISOString() }));
      const batchesToCap = ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR / events.length;
      for (let batchIndex = 0; batchIndex < batchesToCap; batchIndex += 1) {
        await analyticsRepository.recordBatch({ visitorId, day: '2026-11-27', hour: 12, receivedAt: NOW, deviceType: 'desktop', events });
      }
      const before = analyticsRepository.batches.length;

      const response = await request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA).send(batch(visitorId));
      expect(response.status).toBe(429);
      expect(response.body).toEqual({ error: 'Daily analytics limit reached' });
      expect(analyticsRepository.batches).toHaveLength(before);
    });
  });
});

describe('/api/admin/analytics', () => {
  describe('GET /', () => {
    it('returns 401 without or with a wrong key, and 503 when no admin key is configured', async () => {
      const { app } = createTestApp();
      expect((await request(app).get('/api/admin/analytics?days=7')).status).toBe(401);
      expect((await request(app).get('/api/admin/analytics?days=7').set('x-admin-key', 'nope')).status).toBe(401);
      const unconfigured = createTestApp({ adminKey: '' }).app;
      expect((await request(unconfigured).get('/api/admin/analytics?days=7').set('x-admin-key', '')).status).toBe(503);
    });

    it.each([[''], ['?days=2'], ['?days=0'], ['?days=abc'], ['?days=7&days=30']])('returns 400 for days query %j', async (query) => {
      const { app } = createTestApp();
      const response = await request(app).get(`/api/admin/analytics${query}`).set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.status).toBe(400);
    });

    it('returns a zero-filled summary with one entry per day, oldest first', async () => {
      const { app } = createTestApp({ getNow: () => NOW });
      const response = await request(app).get('/api/admin/analytics?days=7').set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        timeZone: 'America/Los_Angeles',
        fromDay: '2026-11-21',
        toDay: '2026-11-27',
        generatedAt: NOW.toISOString(),
        uniqueVisitors: 0,
      });
      expect(response.body.days.map((day: any) => day.day)).toEqual(['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']);
      expect(Object.keys(response.body.totals.events)).toHaveLength(8);
      expect(response.body.totals.funnel).toEqual({ visited: 0, played: 0, marked: 0, won: 0, submitted: 0 });
      expect(response.body.totals.pageViews).toEqual({ play: 0, leaderboard: 0, options: 0 });
      expect(response.body.totals.outboundClicks).toEqual({ header: 0, footer: 0 });
      expect(response.body.totals.devices).toEqual({ mobile: 0, tablet: 0, desktop: 0 });
      expect(response.body.totals.hourly).toHaveLength(24);
      expect(response.body.days[0].hourly).toHaveLength(24);
    });

    it('uses a single day for days=1 and 30 days for days=30', async () => {
      const { app } = createTestApp({ getNow: () => NOW });
      const one = await request(app).get('/api/admin/analytics?days=1').set('x-admin-key', TEST_ADMIN_KEY);
      const thirty = await request(app).get('/api/admin/analytics?days=30').set('x-admin-key', TEST_ADMIN_KEY);
      expect(one.body.days).toHaveLength(1);
      expect(one.body.fromDay).toBe('2026-11-27');
      expect(thirty.body.days).toHaveLength(30);
      expect(thirty.body.fromDay).toBe('2026-10-29');
    });

    it('totals the range and counts unique visitors', async () => {
      let now = new Date('2026-11-26T20:00:00.000Z');
      const { app } = createTestApp({ getNow: () => now });
      const visitorId = randomUUID();
      const send = (id: string, events: unknown[], userAgent: string): Promise<request.Response> =>
        request(app).post('/api/analytics/events').set('User-Agent', userAgent).send(batch(id, events));
      await send(visitorId, [{ name: 'page_view', offsetMs: 0, properties: { route: 'play' } }, { name: 'board_started', offsetMs: 0 }], BROWSER_UA);
      now = new Date('2026-11-27T20:00:00.000Z');
      await send(visitorId, [{ name: 'bingo', offsetMs: 0 }, { name: 'outbound_click', offsetMs: 0, properties: { placement: 'footer' } }], BROWSER_UA);
      await send(randomUUID(), [{ name: 'page_view', offsetMs: 0, properties: { route: 'leaderboard' } }], DESKTOP_UA);

      const response = await request(app).get('/api/admin/analytics?days=7').set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.body.uniqueVisitors).toBe(2);
      expect(response.body.totals.events).toMatchObject({ page_view: 2, board_started: 1, bingo: 1, outbound_click: 1 });
      expect(response.body.totals.funnel).toMatchObject({ visited: 3, played: 1, won: 1 });
      expect(response.body.totals.devices).toEqual({ mobile: 2, tablet: 0, desktop: 1 });
      expect(response.body.totals.pageViews).toEqual({ play: 1, leaderboard: 1, options: 0 });
      expect(response.body.totals.hourly[12]).toBe(5);
      expect(response.body.days.at(-1).day).toBe('2026-11-27');
      expect(response.body.days.at(-1).events.page_view).toBe(1);
    });

    it('still serves the summary when collection is off', async () => {
      const { app } = createTestApp({ analyticsEnabled: false });
      const response = await request(app).get('/api/admin/analytics?days=1').set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.status).toBe(200);
    });

    it('serves a cached response for 30 seconds, then refreshes reading only uncached days', async () => {
      let now = NOW;
      const { app, analyticsRepository } = createTestApp({ getNow: () => now });
      const spy = vi.spyOn(analyticsRepository, 'getDailyTotals');
      const getSummary = (): Promise<request.Response> => request(app).get('/api/admin/analytics?days=7').set('x-admin-key', TEST_ADMIN_KEY);
      const send = (): Promise<request.Response> => request(app).post('/api/analytics/events').set('User-Agent', DESKTOP_UA).send(batch());

      await send();
      const first = await getSummary();
      expect(first.body.totals.events.board_started).toBe(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toHaveLength(7);

      await send();
      now = new Date(NOW.getTime() + 29_000);
      const cached = await getSummary();
      expect(cached.body.totals.events.board_started).toBe(1);
      expect(cached.body.generatedAt).toBe(first.body.generatedAt);
      expect(spy).toHaveBeenCalledTimes(1);

      now = new Date(NOW.getTime() + 31_000);
      const refreshed = await getSummary();
      expect(refreshed.body.totals.events.board_started).toBe(2);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[1][0]).toEqual(['2026-11-27']);
    });
  });
});
