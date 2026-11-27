import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response, type Router } from 'express';

/** Built client location relative to this file (same depth from `server/src` and `server/dist`). */
export const DEFAULT_CLIENT_DIST_PATH = path.resolve(__dirname, '../../../client/dist');

/** Hashed build assets never change, so browsers may cache them for a year. */
const ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/** `index.html` must always be revalidated so a new release is picked up immediately. */
const INDEX_CACHE_CONTROL = 'no-cache';

/**
 * Serves the built client: static files from `clientDistPath`, plus an SPA fallback that returns
 * `index.html` for any other GET outside `/api`. Returns `null` when the build directory is missing
 * (local API-only development and tests), so the server still runs without a client build.
 */
export function createClientRouter(clientDistPath: string): Router | null {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (!existsSync(indexPath)) {
    return null;
  }

  const router = express.Router();

  router.use(
    express.static(clientDistPath, {
      index: false,
      setHeaders: (response: Response, filePath: string): void => {
        const isIndex = path.basename(filePath) === 'index.html';
        response.setHeader('Cache-Control', isIndex ? INDEX_CACHE_CONTROL : ASSET_CACHE_CONTROL);
      },
    }),
  );

  router.use((request: Request, response: Response, next: NextFunction): void => {
    const isPageRequest = request.method === 'GET' && !request.path.startsWith('/api');
    if (!isPageRequest) {
      next();
      return;
    }
    response.setHeader('Cache-Control', INDEX_CACHE_CONTROL);
    response.sendFile(indexPath);
  });

  return router;
}
