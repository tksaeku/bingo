# Bingo server

Express 5 + TypeScript API backed by Firestore. The API contract and server rules live in `../.claude/docs/spec.md`.

## Layout

```
src/
  index.ts            entry point: loads env, listens on PORT
  app.ts              createApp() factory (CORS, body limit, rate limits, routers, client, 404, errors)
  features/           options, leaderboard, admin, health: router assembler, one handler per endpoint, service, Zod schemas, tests
  repositories/       the only Firestore access: typed converters, transactions, collection constants
  middleware/         requireAdminKey, error handler, validation helper, rate limiters, serveClient
  services/firestore.ts   Admin SDK init (Application Default Credentials)
  scripts/            seed and leaderboard migration
  testSupport/        in-memory repositories and test app builder
```

Logs are JSON lines with a `severity` field (`INFO`, `WARNING`, `ERROR`) for Cloud Logging.

Requests flow route, service, repository. Tests build the real app with `createApp` and inject in-memory repositories, so nothing touches Firestore.

## Setup

1. Copy `.env.example` to `.env` and fill in the placeholders.
2. Provide Firestore access one of two ways:
   - Credentials: set `FIREBASE_SERVICE_ACCOUNT_PATH` to the service account JSON (e.g. `./serviceAccountKey.json`). It takes precedence over any machine-wide `GOOGLE_APPLICATION_CREDENTIALS`. On App Hosting it is left unset and ambient credentials are used.
   - Firestore emulator: set `FIRESTORE_EMULATOR_HOST` (for example `127.0.0.1:8080`); no credentials are needed.

## Environment

| Variable | Purpose |
|---|---|
| `PORT` | Listen port, default 5174 |
| `ADMIN_KEY` | Admin secret compared in constant time against the `x-admin-key` header; when unset, admin endpoints return 503 |
| `CORS_ORIGINS` | Comma-separated cross-origin allow-list; defaults to `http://localhost:5173` (production is same-origin) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Service account JSON path for local development; overrides `GOOGLE_APPLICATION_CREDENTIALS` |
| `FIRESTORE_EMULATOR_HOST` | Use the Firestore emulator |
| `TRUSTED_PROXY_HOPS` | Reverse-proxy hops in front of the server (non-negative integer, default 1); drives client IP detection for rate limiting |

## Scripts

Run from the repo root with `npm run <script> -w server`.

| Script | Action |
|---|---|
| `dev` | `tsx watch src/index.ts` |
| `build` | Compile to `dist/` (tests excluded) |
| `start` | `node dist/index.js` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `eslint .` |
| `test` | `vitest run` |
| `seed` | Replace the option pool with sample options. Refuses to run unless `FIRESTORE_EMULATOR_HOST` is set or `--yes` is passed |
| `migrate:leaderboard` | Re-key leaderboard documents to normalized-name IDs, merging duplicates. Dry run by default; pass `--apply` to write |

Pass script flags after `--`, for example `npm run seed -w server -- --yes`.

## Firestore data

- `options`: `text`, `createdAt`. Capped at 200 documents; duplicates are rejected case-insensitively inside a transaction.
- `leaderboard`: `playerName`, `wins`, `lastWin`. The document ID is the percent-encoded normalized (lowercase, whitespace-collapsed) player name, and wins are incremented in a transaction.

The leaderboard query orders by `wins` only (single-field index) and breaks ties on `lastWin` in memory, so no composite index is required.
