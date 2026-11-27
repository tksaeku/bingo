import cors from 'cors';
import express, { type Express } from 'express';
import { parseAnalyticsEnabled, parseCorsOrigins, parseTrustedProxyHops } from './config';
import {
  ADMIN_WRITE_LIMIT_PER_WINDOW,
  ANALYTICS_IP_LIMIT_PER_WINDOW,
  ANALYTICS_VISITOR_LIMIT_PER_WINDOW,
  JSON_BODY_LIMIT,
  LEADERBOARD_WRITE_LIMIT_PER_WINDOW,
} from './constants';
import { createAdminRouter } from './features/admin/admin';
import { createAnalyticsRouter } from './features/analytics/analytics';
import { createAnalyticsAdminRouter } from './features/analytics/analyticsAdmin';
import { createAnalyticsService } from './features/analytics/analyticsService';
import { createHealthRouter } from './features/health/health';
import { createLeaderboardRouter } from './features/leaderboard/leaderboard';
import { createLeaderboardService } from './features/leaderboard/leaderboardService';
import { createOptionsRouter } from './features/options/options';
import { createOptionsService } from './features/options/optionsService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createKeyedRateLimiter, createRateLimiter, getIpRateLimitKey, getVisitorRateLimitKey } from './middleware/rateLimiters';
import { createRequireAdminKey } from './middleware/requireAdminKey';
import { createRequireAnalyticsEnabled } from './middleware/requireAnalyticsEnabled';
import { createClientRouter, DEFAULT_CLIENT_DIST_PATH } from './middleware/serveClient';
import { FirestoreAnalyticsRepository } from './repositories/FirestoreAnalyticsRepository';
import { FirestoreLeaderboardRepository } from './repositories/FirestoreLeaderboardRepository';
import { FirestoreOptionsRepository } from './repositories/FirestoreOptionsRepository';
import type { AnalyticsRepository, LeaderboardRepository, OptionsRepository } from './repositories/repositoryTypes';

export type CreateAppOptions = {
  optionsRepository?: OptionsRepository;
  leaderboardRepository?: LeaderboardRepository;
  analyticsRepository?: AnalyticsRepository;
  /** Defaults to ANALYTICS_ENABLED === 'true'; when off, event ingestion answers 410 and the admin summary still works. */
  analyticsEnabled?: boolean;
  /** Defaults to ADMIN_KEY; empty or unset makes admin endpoints return 503. */
  adminKey?: string;
  /** Defaults to CORS_ORIGINS, then the built-in allow-list. */
  corsOrigins?: string[];
  /** Defaults to TRUSTED_PROXY_HOPS, then 1. */
  trustedProxyHops?: number;
  getNow?: () => Date;
  /** Built client to serve alongside the API. Defaults to `client/dist`; `null` serves the API only. */
  clientDistPath?: string | null;
};

/**
 * Builds the Express app: the `/api` routes plus, when a client build exists, the static client
 * with an SPA fallback. Repositories default to Firestore (initialized lazily on first use); tests
 * inject in-memory fakes.
 */
export function createApp(options: CreateAppOptions = {}): Express {
  const optionsRepository = options.optionsRepository ?? new FirestoreOptionsRepository();
  const leaderboardRepository = options.leaderboardRepository ?? new FirestoreLeaderboardRepository();
  const analyticsRepository = options.analyticsRepository ?? new FirestoreAnalyticsRepository();
  const analyticsEnabled = options.analyticsEnabled ?? parseAnalyticsEnabled(process.env.ANALYTICS_ENABLED);
  const adminKey = options.adminKey ?? process.env.ADMIN_KEY;
  const allowedOrigins = options.corsOrigins ?? parseCorsOrigins(process.env.CORS_ORIGINS);

  const requireAdminKey = createRequireAdminKey(adminKey);
  const adminLimiter = createRateLimiter(ADMIN_WRITE_LIMIT_PER_WINDOW);
  const submitWinLimiter = createRateLimiter(LEADERBOARD_WRITE_LIMIT_PER_WINDOW);
  const analyticsService = createAnalyticsService(analyticsRepository, options.getNow);

  const app = express();
  app.set('trust proxy', options.trustedProxyHops ?? parseTrustedProxyHops(process.env.TRUSTED_PROXY_HOPS));
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: (origin, callback): void => {
        callback(null, origin === undefined || allowedOrigins.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use('/api/health', createHealthRouter());
  app.use('/api/options', createOptionsRouter({ service: createOptionsService(optionsRepository), adminWriteLimiter: adminLimiter, requireAdminKey }));
  app.use('/api/leaderboard', createLeaderboardRouter({ service: createLeaderboardService(leaderboardRepository, options.getNow), submitWinLimiter }));
  app.use(
    '/api/analytics',
    createAnalyticsRouter({
      service: analyticsService,
      requireAnalyticsEnabled: createRequireAnalyticsEnabled(analyticsEnabled),
      ipLimiter: createKeyedRateLimiter(ANALYTICS_IP_LIMIT_PER_WINDOW, getIpRateLimitKey),
      visitorLimiter: createKeyedRateLimiter(ANALYTICS_VISITOR_LIMIT_PER_WINDOW, getVisitorRateLimitKey),
    }),
  );
  app.use('/api/admin/analytics', createAnalyticsAdminRouter({ service: analyticsService, adminLimiter, requireAdminKey }));
  app.use('/api/admin', createAdminRouter({ adminLimiter, requireAdminKey }));

  const clientDistPath = options.clientDistPath === undefined ? DEFAULT_CLIENT_DIST_PATH : options.clientDistPath;
  const clientRouter = clientDistPath === null ? null : createClientRouter(clientDistPath);
  if (clientRouter !== null) {
    app.use(clientRouter);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
