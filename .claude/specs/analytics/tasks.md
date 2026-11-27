# Analytics — implementation tasks

The tasks are ordered so each one leaves `npm run check` green. Server tasks (S) go to `tkserver-dev`, client tasks (C) to `tkclient-dev`. C1 needs only the contract in [`api.md`](api.md), so it can run in parallel with S1–S4.

## Server

### S1 — Shared types, constants, config

- `server/src/types.ts`: `AnalyticsEventName`, the `AnalyticsEvent` union, `EventBatch`, `DeviceType`, `FunnelStep`, `AnalyticsSummary`, `DailyAnalytics`.
- `server/src/constants.ts`:
  - collection names (`ANALYTICS_EVENT_BATCHES_COLLECTION`, `ANALYTICS_DAYS_COLLECTION`, `ANALYTICS_SHARDS_SUBCOLLECTION`, `ANALYTICS_VISITOR_DAYS_COLLECTION`, `ANALYTICS_VISITORS_COLLECTION`);
  - `ANALYTICS_TIME_ZONE = 'America/Los_Angeles'`;
  - `ANALYTICS_COUNTER_SHARDS = 10`;
  - `ANALYTICS_RAW_RETENTION_DAYS = 30`;
  - `ANALYTICS_MAX_BATCH_EVENTS = 20`;
  - `ANALYTICS_MAX_OFFSET_MS = 300_000`;
  - `ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR = 500`;
  - `ANALYTICS_IP_LIMIT_PER_WINDOW = 600`;
  - `ANALYTICS_VISITOR_LIMIT_PER_WINDOW = 20`;
  - `ANALYTICS_SUMMARY_CACHE_MS = 30_000`;
  - `ANALYTICS_SUMMARY_DAY_OPTIONS = [1, 7, 30]`.
- `server/src/config.ts`: `parseAnalyticsEnabled(value)` returns `true` only for the string `'true'`.
- **Done when** unit tests cover `parseAnalyticsEnabled`.

### S2 — Pure helpers

- `features/analytics/analyticsTime.ts`: `getAnalyticsDay(date)`, `getAnalyticsHour(date)` (via `Intl.DateTimeFormat` with the LA zone), `getRecentDays(today, count)`.
- `features/analytics/userAgent.ts`: `getIsBot(userAgent)`, `getDeviceType(userAgent)`.
- `features/analytics/funnel.ts`: `getFunnelStepsForEvents(events)`.
- **Done when** tests cover:
  - day and hour around LA midnight, including DST changeovers;
  - the bot pattern, and the device cases in [`abuse-and-privacy.md`](abuse-and-privacy.md);
  - the step mapping.

### S3 — Schemas, repository, fake

- `features/analytics/analyticsSchemas.ts`: the strict `EventBatch` schema with a discriminated union on `name`, and the `days` query schema.
- `repositories/repositoryTypes.ts`, add an `AnalyticsRepository` with:
  - `recordBatch(input) → 'recorded' | 'daily_cap_exceeded'`;
  - `getDailyTotals(days)`;
  - `countVisitorsSince(day)`;
  - `listBatches(fromDay, toDay)`.
- `repositories/FirestoreAnalyticsRepository.ts`:
  - the transaction from [`data-model.md`](data-model.md);
  - shard `getAll` reads;
  - the `count()` aggregation;
  - converters.
- `testSupport/FakeAnalyticsRepository.ts`: in-memory, same semantics including the daily cap.
- **Done when:**
  - schema tests cover every rejection in [`api.md`](api.md) (unknown key, bad UUID, 0 or 21 events, out-of-range offset, wrong or missing properties, lone surrogate);
  - repository tests run against `FakeFirestore`, as the existing repository tests do;
  - funnel and device counts increment only once per visitor per day, the cap aborts with no writes, and `expireAt` is set.

### S4 — Service, middleware, routes, app wiring

- `features/analytics/analyticsService.ts`:
  - `recordEvents(batch, userAgent)` derives device type and day, then calls the repository;
  - `getSummary(days)` zero-fills, sums shards, caches completed days forever and whole responses for 30 s, and totals the range.
- `middleware/rateLimiters.ts`: `createKeyedRateLimiter(limit, keyGenerator)`, plus visitor and IP key generators.
- `features/analytics/`:
  - `analytics.ts` (router for `POST /events` with the middleware order from [`api.md`](api.md));
  - `recordEventsHandler.ts`;
  - `analyticsAdmin.ts` (router for `GET /`, admin limiter + `requireAdminKey`);
  - `getAnalyticsSummaryHandler.ts`.
- `app.ts`:
  - `CreateAppOptions` gains `analyticsRepository?` and `analyticsEnabled?` (default `parseAnalyticsEnabled(process.env.ANALYTICS_ENABLED)`);
  - mount `/api/analytics` and `/api/admin/analytics`.
- `testSupport/createTestApp.ts`: inject the fake and accept `analyticsEnabled`.
- **Done when** supertest covers:
  - `204` stored;
  - `204` for a bot UA with nothing stored;
  - `400`;
  - `410` with nothing stored, and summary still served;
  - `413`;
  - `429` for IP, visitor and daily cap;
  - summary `401` and `503`;
  - `days` validation;
  - zero-filled shape;
  - the cache serving within 30 s.

### S5 — Export script and ops config

- `scripts/exportAnalytics.ts`: `--from`, `--to`, `--out`, `--yes` (AC-A19). Add the `analytics:export` script to `server/package.json`.
- `server/.env.example`: add `ANALYTICS_ENABLED=false`, with a comment.
- `apphosting.yaml`: add `ANALYTICS_ENABLED` with `value: "true"` and `availability: [RUNTIME]`.
- **Done when** the export script's argument parsing and its flattening are unit-tested, and it refuses to run without `--yes` against a non-emulator project.

## Client

### C1 — Types, visitor ID, tracker, API

- `types.ts`, `constants.ts`, `services/visitorIdStorage.ts`, `services/analytics.ts`, and `analyticsApi` in `services/api.ts`, as described in [`client.md`](client.md).
- **Done when** the tracker and storage tests in [`client.md`](client.md) pass.

### C2 — Instrumentation

- Add `usePageViewTracking`, called in `App`.
- Add the events in `useBingoBoard` and `BingoBoard`.
- Add the `outbound_click` handlers on both links in `App`.
- **Done when:**
  - the event-timing tests in [`client.md`](client.md) pass;
  - existing game tests still pass, with `services/analytics` mocked in them.

### C3 — `/stats` page and dashboard

- `useAnalyticsSummary`, `pages/StatsPage/`, `components/StatsDashboard/` and its subcomponents.
- The `/stats` route (no nav link, like `/cards`).
- **Done when** the dashboard tests in [`client.md`](client.md) pass, and the page works at 375 px wide (most admins will check it on a phone).

### C4 (optional) — Footer note

- A short line in the footer: "Anonymous usage stats help us improve the game."

## Docs (after S5 and C3)

- `.claude/docs/spec.md`: add the two endpoints to the API contract table, a short "Analytics" section that points to the `AC-A*` criteria, and the new collections under "Data".
- `CLAUDE.md`:
  - add `analytics` to the server feature list and `useAnalyticsSummary` to the client hooks;
  - add `ANALYTICS_ENABLED` to the environment section;
  - add the export command and the TTL policy step to deployment.

## Verification

- From the repo root, after all tasks: `npm run check`.
- Then a manual pass against the Firestore emulator with `ANALYTICS_ENABLED=true`:
  - play a board to bingo and submit;
  - open the leaderboard;
  - click an outbound link;
  - reload a saved board;
  - confirm the counts on `/stats` and the documents in the emulator UI.

## Rollout

1. Merge to `main`. App Hosting builds and deploys with `ANALYTICS_ENABLED=true`.
2. Run the three `gcloud firestore fields ttls update` commands in [`data-model.md`](data-model.md). This is a one-time step; TTL policies can take a few minutes to become active.
3. On the live site, play once on a phone and once on desktop, then check `/stats`.
4. Review the leaderboard's per-IP limit for venue Wi-Fi (see [`abuse-and-privacy.md`](abuse-and-privacy.md)).

## Switching off after the event

1. In `apphosting.yaml`, set `ANALYTICS_ENABLED` to `"false"` and push. The endpoint answers `410` and clients stop sending for the rest of their page session.
2. Optionally, run `analytics:export` for the event week before the 30-day TTL removes the raw data.
3. Daily totals stay, and `/stats` keeps showing them.

## Open questions (defaults used above)

| Question | Default in this spec |
|---|---|
| How long to keep raw batches and visitor docs | 30 days, long enough to analyze after a one-week event |
| Respect Global Privacy Control | Yes |
| Footer privacy note | Optional (C4) |
| Expected peak daily visitors (drives the cost estimate) | 1,500 |
| Raise the leaderboard's per-IP limit for venue Wi-Fi | Flagged for review; not changed by this feature |
