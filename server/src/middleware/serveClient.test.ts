import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../testSupport/createTestApp';
import { createClientRouter } from './serveClient';

/** Creates a throwaway client build with an index page and one hashed asset. */
function createClientBuild(): string {
  const clientDistPath = mkdtempSync(path.join(tmpdir(), 'bingo-client-'));
  mkdirSync(path.join(clientDistPath, 'assets'));
  writeFileSync(path.join(clientDistPath, 'index.html'), '<!doctype html><title>Bingo</title>');
  writeFileSync(path.join(clientDistPath, 'assets', 'index-abc123.js'), 'console.log("bingo");');
  return clientDistPath;
}

describe('serveClient', () => {
  describe('createClientRouter', () => {
    it('returns null when the build directory has no index.html', () => {
      const emptyPath = mkdtempSync(path.join(tmpdir(), 'bingo-empty-'));
      expect(createClientRouter(emptyPath)).toBeNull();
    });
  });

  describe('with a client build', () => {
    it('serves index.html at the root without long-term caching', async () => {
      const { app } = createTestApp({ clientDistPath: createClientBuild() });
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('<title>Bingo</title>');
      expect(response.headers['cache-control']).toBe('no-cache');
    });

    it('falls back to index.html for client-side routes', async () => {
      const { app } = createTestApp({ clientDistPath: createClientBuild() });
      const response = await request(app).get('/leaderboard');
      expect(response.status).toBe(200);
      expect(response.text).toContain('<title>Bingo</title>');
    });

    it('serves hashed assets with immutable caching', async () => {
      const { app } = createTestApp({ clientDistPath: createClientBuild() });
      const response = await request(app).get('/assets/index-abc123.js');
      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toContain('immutable');
    });

    it('keeps the JSON 404 for unknown API routes', async () => {
      const { app } = createTestApp({ clientDistPath: createClientBuild() });
      const response = await request(app).get('/api/nope');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Not found' });
    });

    it('still serves the API', async () => {
      const { app } = createTestApp({ clientDistPath: createClientBuild() });
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('does not answer non-GET page requests with index.html', async () => {
      const { app } = createTestApp({ clientDistPath: createClientBuild() });
      const response = await request(app).post('/leaderboard');
      expect(response.status).toBe(404);
    });
  });
});
