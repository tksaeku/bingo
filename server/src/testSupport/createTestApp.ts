import type { Express } from 'express';
import { createApp, type CreateAppOptions } from '../app';
import { FakeAnalyticsRepository } from './FakeAnalyticsRepository';
import { FakeLeaderboardRepository } from './FakeLeaderboardRepository';
import { FakeOptionsRepository } from './FakeOptionsRepository';

export const TEST_ADMIN_KEY = 'test-admin-key';

export type TestApp = {
  app: Express;
  optionsRepository: FakeOptionsRepository;
  leaderboardRepository: FakeLeaderboardRepository;
  analyticsRepository: FakeAnalyticsRepository;
};

/** Builds the real app wired to in-memory repositories and a fixed admin key. */
export function createTestApp(overrides: CreateAppOptions & { optionsRepository?: FakeOptionsRepository; leaderboardRepository?: FakeLeaderboardRepository; analyticsRepository?: FakeAnalyticsRepository } = {}): TestApp {
  const optionsRepository = overrides.optionsRepository ?? new FakeOptionsRepository();
  const leaderboardRepository = overrides.leaderboardRepository ?? new FakeLeaderboardRepository();
  const analyticsRepository = overrides.analyticsRepository ?? new FakeAnalyticsRepository();
  const app = createApp({ adminKey: TEST_ADMIN_KEY, clientDistPath: null, analyticsEnabled: true, ...overrides, optionsRepository, leaderboardRepository, analyticsRepository });
  return { app, optionsRepository, leaderboardRepository, analyticsRepository };
}
