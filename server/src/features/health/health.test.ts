import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../../testSupport/createTestApp';

describe('GET /api/health', () => {
  it('returns 200 { status: "ok" }', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
