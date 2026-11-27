import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp, TEST_ADMIN_KEY } from './testSupport/createTestApp';

describe('createApp', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/nope');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });

  it('returns a JSON 400 for malformed JSON', async () => {
    const { app } = createTestApp();
    const response = await request(app).post('/api/leaderboard').set('content-type', 'application/json').send('{"playerName": ');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Malformed JSON' });
  });

  it('returns 413 for bodies over 10kb', async () => {
    const { app } = createTestApp();
    const response = await request(app).post('/api/options').set('x-admin-key', TEST_ADMIN_KEY).send({ text: 'a'.repeat(11 * 1024) });
    expect(response.status).toBe(413);
  });

  it('returns a generic 500 without leaking internals', async () => {
    const { app } = createTestApp({
      optionsRepository: {
        listOptions: async () => {
          throw new Error('secret firestore detail');
        },
        createUniqueOption: async () => ({ status: 'full' }),
        deleteOption: async () => false,
      },
    } as any);
    const response = await request(app).get('/api/options');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  it('allows listed CORS origins only', async () => {
    const { app } = createTestApp({ corsOrigins: ['https://allowed.example'] });
    const allowed = await request(app).get('/api/health').set('origin', 'https://allowed.example');
    const blocked = await request(app).get('/api/health').set('origin', 'https://evil.example');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns 400 for an undecodable :id param instead of 500', async () => {
    const { app } = createTestApp();
    const response = await request(app).delete('/api/options/%E0%A4%A').set('x-admin-key', TEST_ADMIN_KEY);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Bad request' });
  });

  it('honors the trusted proxy hop count', async () => {
    const { app } = createTestApp({ trustedProxyHops: 2 });
    expect(app.get('trust proxy')).toBe(2);
  });
});
