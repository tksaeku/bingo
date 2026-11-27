import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp, TEST_ADMIN_KEY } from '../../testSupport/createTestApp';

describe('GET /api/admin/verify', () => {
  it('returns 204 with the correct key', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/admin/verify').set('x-admin-key', TEST_ADMIN_KEY);
    expect(response.status).toBe(204);
  });

  it('returns 401 with a missing or wrong key', async () => {
    const { app } = createTestApp();
    expect((await request(app).get('/api/admin/verify')).status).toBe(401);
    expect((await request(app).get('/api/admin/verify').set('x-admin-key', 'wrong')).status).toBe(401);
    expect((await request(app).get('/api/admin/verify').set('x-admin-key', `${TEST_ADMIN_KEY}x`)).status).toBe(401);
  });

  it('fails closed with 503 when no admin key is configured', async () => {
    const { app } = createTestApp({ adminKey: '' });
    const response = await request(app).get('/api/admin/verify').set('x-admin-key', 'anything');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Admin access is not configured' });
  });
});
