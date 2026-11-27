import type { Express } from 'express';
import { createApp, type CreateAppOptions } from '../app';
import { FakeLeaderboardRepository } from './FakeLeaderboardRepository';
import { FakeOptionsRepository } from './FakeOptionsRepository';

export const TEST_ADMIN_KEY = 'test-admin-key';

export type TestApp = {
  app: Express;
  optionsRepository: FakeOptionsRepository;
  leaderboardRepository: FakeLeaderboardRepository;
};

/** Builds the real app wired to in-memory repositories and a fixed admin key. */
export function createTestApp(overrides: CreateAppOptions & { optionsRepository?: FakeOptionsRepository; leaderboardRepository?: FakeLeaderboardRepository } = {}): TestApp {
  const optionsRepository = overrides.optionsRepository ?? new FakeOptionsRepository();
  const leaderboardRepository = overrides.leaderboardRepository ?? new FakeLeaderboardRepository();
  const app = createApp({ adminKey: TEST_ADMIN_KEY, clientDistPath: null, ...overrides, optionsRepository, leaderboardRepository });
  return { app, optionsRepository, leaderboardRepository };
}
