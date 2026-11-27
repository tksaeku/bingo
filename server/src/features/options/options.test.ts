import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { FakeOptionsRepository } from '../../testSupport/FakeOptionsRepository';
import { createTestApp, TEST_ADMIN_KEY } from '../../testSupport/createTestApp';

describe('/api/options', () => {
  describe('GET /', () => {
    it('lists options ordered by createdAt ascending with ISO timestamps and ids', async () => {
      const { app } = createTestApp({ optionsRepository: new FakeOptionsRepository(['First', 'Second']) });
      const response = await request(app).get('/api/options');
      expect(response.status).toBe(200);
      expect(response.body.map((option: any) => option.text)).toEqual(['First', 'Second']);
      expect(response.body[0]).toEqual({ id: 'seed-0', text: 'First', createdAt: '2026-01-01T00:00:00.000Z' });
    });
  });

  describe('POST /', () => {
    it('creates an option and returns 201', async () => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/options').set('x-admin-key', TEST_ADMIN_KEY).send({ text: '  Hello  ' });
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ text: 'Hello' });
      expect(typeof response.body.id).toBe('string');
    });

    it('returns 401 without a key and with a wrong key', async () => {
      const { app } = createTestApp();
      const missing = await request(app).post('/api/options').send({ text: 'x' });
      const wrong = await request(app).post('/api/options').set('x-admin-key', 'nope').send({ text: 'x' });
      expect(missing.status).toBe(401);
      expect(wrong.status).toBe(401);
    });

    it('returns 503 when ADMIN_KEY is not configured', async () => {
      const { app } = createTestApp({ adminKey: '' });
      const response = await request(app).post('/api/options').set('x-admin-key', '').send({ text: 'x' });
      expect(response.status).toBe(503);
    });

    it.each([
      ['non-string', { text: 123 }],
      ['empty', { text: '' }],
      ['whitespace only', { text: '   ' }],
      ['too long', { text: 'a'.repeat(101) }],
      ['missing', {}],
    ])('returns 400 for %s text', async (_label, body) => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/options').set('x-admin-key', TEST_ADMIN_KEY).send(body);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
    });

    it('returns 400 for text with a lone surrogate', async () => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/options').set('x-admin-key', TEST_ADMIN_KEY).send({ text: 'bad\uD800' });
      expect(response.status).toBe(400);
    });

    it('returns 409 for a case-insensitive duplicate', async () => {
      const { app } = createTestApp({ optionsRepository: new FakeOptionsRepository(['Gold costume']) });
      const response = await request(app).post('/api/options').set('x-admin-key', TEST_ADMIN_KEY).send({ text: ' gold COSTUME ' });
      expect(response.status).toBe(409);
    });

    it('returns 201 when the pool already has more than 200 options', async () => {
      const texts = Array.from({ length: 250 }, (_unused, index) => `Option ${index}`);
      const { app } = createTestApp({ optionsRepository: new FakeOptionsRepository(texts) });
      const response = await request(app).post('/api/options').set('x-admin-key', TEST_ADMIN_KEY).send({ text: 'Extra' });
      expect(response.status).toBe(201);
    });

    it('returns 429 after 30 admin writes per minute', async () => {
      const { app } = createTestApp();
      const statuses: number[] = [];
      for (let attempt = 0; attempt < 31; attempt += 1) {
        const response = await request(app).post('/api/options').set('x-admin-key', 'wrong').send({ text: 'x' });
        statuses.push(response.status);
      }
      expect(statuses[29]).toBe(401);
      expect(statuses[30]).toBe(429);
    });
  });

  describe('DELETE /:id', () => {
    it('returns 204 and removes the option', async () => {
      const { app, optionsRepository } = createTestApp({ optionsRepository: new FakeOptionsRepository(['A']) });
      const response = await request(app).delete('/api/options/seed-0').set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.status).toBe(204);
      expect(optionsRepository.options).toHaveLength(0);
    });

    it('returns 404 for an unknown id', async () => {
      const { app } = createTestApp();
      const response = await request(app).delete('/api/options/missing').set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.status).toBe(404);
    });

    it('returns 400 for a malformed id', async () => {
      const { app } = createTestApp();
      const response = await request(app).delete('/api/options/bad.id!').set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.status).toBe(400);
    });

    it('returns 401 without the admin key', async () => {
      const { app } = createTestApp();
      const response = await request(app).delete('/api/options/seed-0');
      expect(response.status).toBe(401);
    });
  });
});
