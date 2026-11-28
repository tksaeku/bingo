import type { Express } from 'express';
import { createApp, type CreateAppOptions } from '../app';
import { FakeAdminPasskeyRepository } from './FakeAdminPasskeyRepository';
import { FakeAnalyticsRepository } from './FakeAnalyticsRepository';
import { FakeLeaderboardRepository } from './FakeLeaderboardRepository';
import { FakeOptionsRepository } from './FakeOptionsRepository';
import { FakeWebAuthnAdapter } from './FakeWebAuthnAdapter';

export const TEST_ADMIN_KEY = 'test-admin-key';

export type TestApp = {
  app: Express;
  optionsRepository: FakeOptionsRepository;
  leaderboardRepository: FakeLeaderboardRepository;
  analyticsRepository: FakeAnalyticsRepository;
  adminPasskeyRepository: FakeAdminPasskeyRepository;
  webAuthn: FakeWebAuthnAdapter;
};

/** Builds the real app wired to in-memory repositories and a fixed admin key. */
export function createTestApp(overrides: CreateAppOptions & { optionsRepository?: FakeOptionsRepository; leaderboardRepository?: FakeLeaderboardRepository; analyticsRepository?: FakeAnalyticsRepository; adminPasskeyRepository?: FakeAdminPasskeyRepository; webAuthn?: FakeWebAuthnAdapter } = {}): TestApp {
  const optionsRepository = overrides.optionsRepository ?? new FakeOptionsRepository();
  const leaderboardRepository = overrides.leaderboardRepository ?? new FakeLeaderboardRepository();
  const analyticsRepository = overrides.analyticsRepository ?? new FakeAnalyticsRepository();
  const adminPasskeyRepository = overrides.adminPasskeyRepository ?? new FakeAdminPasskeyRepository();
  const webAuthn = overrides.webAuthn ?? new FakeWebAuthnAdapter();
  const app = createApp({ adminKey: TEST_ADMIN_KEY, clientDistPath: null, analyticsEnabled: true, ...overrides, optionsRepository, leaderboardRepository, analyticsRepository, adminPasskeyRepository, webAuthn });
  return { app, optionsRepository, leaderboardRepository, analyticsRepository, adminPasskeyRepository, webAuthn };
}
