# Bingo — Product Spec & API Contract

## Game

- **AC-G1** A board is 5×5 (25 cells). The center cell (index 12) is a pre-marked "FREE" cell.
- **AC-G2** The other 24 cells are distinct options drawn uniformly at random (Fisher–Yates) from the option pool.
- **AC-G3** If the pool has fewer than 24 options the board is not generated and the player sees a clear "not enough options" message.
- **AC-G4** Clicking (or pressing Enter/Space on) an unmarked cell marks it; doing the same on a marked cell unmarks it. The free cell is always marked and cannot be toggled.
- **AC-G5** A win is any fully marked row, column, or either diagonal (12 lines). The free cell counts as marked.
- **AC-G6** The board persists in `localStorage` across reloads. A saved board that fails validation (not 25 cells, missing fields, unparsable) is discarded and a new board is generated — the player never gets stuck on an error.
- **AC-G7** On the first winning mark, a win modal opens once. Further clicks on the same board — including unmarking and re-completing a line — do not reopen it automatically; unmarking during the open delay cancels it. A won board whose score has not been submitted (modal closed, or board restored after a reload) shows a "Submit score" button that reopens the modal; the flag is persisted with the saved board and the button disappears once the score is submitted.
- **AC-G8** "New Board" clears the saved board and generates a fresh one.

## Win submission

- **AC-W1** The win modal asks for a player name (1–20 characters after trimming, internal whitespace collapsed). The input has a visible label.
- **AC-W2** Submitting shows a pending state; on success the modal shows confirmation and "Play Again" generates a **new** board (the won board is cleared from storage).
- **AC-W3** On failure the modal shows the error and lets the player retry. The modal only closes when the player closes it or plays again.
- **AC-W4** The modal is an accessible dialog: `role="dialog"`, `aria-modal`, labelled heading, focus moves into it and is trapped, Escape closes it. Confetti respects `prefers-reduced-motion`.

## Leaderboard

- **AC-L1** Shows the top 20 players ordered by wins (desc), ties broken by most recent win (desc).
- **AC-L2** Player names are matched case-insensitively after trimming/collapsing whitespace — "Bob", "bob " and " BOB" are the same player. The display name is the casing from the player's first win.
- **AC-L3** Auto-refreshes every 30 s and has a Refresh button. Refreshes do not blank the table; only the initial load shows a loading state. A failed fetch shows an error, not "No winners yet".

## Option management (admin)

- **AC-O1** Option writes require admin auth (a passkey session or the admin key; see *Admin auth*). The header has no link to the cards page; admins reach it by visiting `/cards` directly.
- **AC-O2** Visiting `/cards` (the admin page for the option pool, shown to players as "cards"; `/options` redirects there) without an admin session shows the unlock screen: **Unlock with passkey**, with admin-key sign-in as the fallback. A neutral loading state shows while the session is checked. A failed unlock shows an error. After a key sign-in on a browser that supports passkeys, the page opens an **Add a passkey for this device** dialog. The **Lock** button is on `/passkeys` (AC-O6). The client never stores the key or a token; the session is an httpOnly cookie. Behavior and acceptance criteria: [`../specs/passkey/requirements.md`](../specs/passkey/requirements.md).
- **AC-O3** Admins can add an option (1–100 characters after trimming) and delete an option. Duplicates (case-insensitive, trimmed) are rejected with a clear message.
- **AC-O4** Adding/deleting does not blank the list or steal focus from the input; buttons are disabled while a request is in flight. Deletion asks for confirmation with an in-page control (no `window.confirm`/`alert`).
- **AC-O5** A 401 from any admin request returns the page to the unlock screen with "Your admin session ended. Unlock again."
- **AC-O6** `/passkeys` (no nav link; behind the same unlock screen) lists the stored passkeys (name, added, last used or "Never used") with remove (in-page confirmation) and **Add a passkey**, and holds the **Lock** button that ends the session in this browser. Removing a passkey ends every session unlocked with it. `/cards` and `/stats` have no Lock button or passkey list.

## API contract

Base path `/api`. All bodies are JSON. All errors are `{ "error": string }` (plus optional `"details"` for validation errors). Timestamps are ISO-8601 strings.

| Method & path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /api/health` | — | — | `200 { "status": "ok" }` | — |
| `GET /api/options` | — | — | `200 Option[]` ordered by `createdAt` asc | 500 |
| `POST /api/options` | admin | `{ "text": string }` 1–100 chars trimmed | `201 Option` | 400 invalid, 401, 409 duplicate, 429, 503 admin key not configured |
| `DELETE /api/options/:id` | admin | — | `204` | 400 bad id, 401, 404, 429, 503 |
| `GET /api/admin/verify` | admin | — | `204` | 401, 429, 503 |
| `POST /api/auth/session` | — | `{ "adminKey": string }` | `204` + session cookie | 400, 401, 429, 503 |
| `DELETE /api/auth/session` | — | — | `204`, session cookie cleared | 429 |
| `POST /api/auth/passkey/options` | — | — | `200 PublicKeyCredentialRequestOptionsJSON` + challenge cookie | 429, 503 |
| `POST /api/auth/passkey/verify` | — | `{ "response": AuthenticationResponseJSON }` | `204` + session cookie | 400, 401, 429, 503 |
| `POST /api/admin/passkeys/registration-options` | admin | — | `200 PublicKeyCredentialCreationOptionsJSON` + challenge cookie | 401, 429, 503 |
| `POST /api/admin/passkeys` | admin | `{ "response": RegistrationResponseJSON, "name"?: string }` | `201 AdminPasskey` + session cookie | 400, 401, 429, 503 |
| `GET /api/admin/passkeys` | admin | — | `200 AdminPasskey[]` | 401, 429, 503 |
| `DELETE /api/admin/passkeys/:id` | admin | — | `204` | 400 bad id, 401, 404, 429, 503 |
| `GET /api/leaderboard` | — | — | `200 LeaderboardEntry[]` (max 20, order per AC-L1) | 500 |
| `POST /api/leaderboard` | — | `{ "playerName": string }` 1–20 chars after normalization | `200 LeaderboardEntry` (updated entry) | 400, 429 |
| `POST /api/analytics/events` | — | `EventBatch` (see analytics `api.md`) | `204` (stored, or dropped as a bot) | 400 invalid, 410 collection off, 413, 429, 500 |
| `GET /api/admin/analytics?days=1\|7\|30` | admin | — | `200 AnalyticsSummary` | 400 bad `days`, 401, 429, 503 admin key not configured, 500 |

- **Option** — `id` (string), `text` (string), `createdAt` (ISO string).
- **LeaderboardEntry** — `id` (string), `playerName` (string), `wins` (number), `lastWin` (ISO string).
- **AdminPasskey** — `id` (string, base64url credential ID), `name` (string), `createdAt` (ISO string), `lastUsedAt` (ISO string or `null`). Ceremony shapes and validation: [`../specs/passkey/api.md`](../specs/passkey/api.md).

The client mirrors these in `client/src/types.ts`; the server defines them in `server/src/types.ts`.

### Server rules

- **Admin auth** — an admin endpoint accepts a valid admin session cookie **or** a valid `x-admin-key` header (compared to `ADMIN_KEY` in constant time). When the header is present it alone decides. The session cookie is HMAC-signed with a key derived from `ADMIN_KEY`, lasts 12 hours, is `HttpOnly`, `SameSite=Strict`, `Path=/api`, and is bound to the passkey that issued it, so deleting that passkey ends the session. Passkeys use the relying party `WEBAUTHN_RP_ID` and origins `WEBAUTHN_ORIGINS`. If `ADMIN_KEY` is unset, admin endpoints and `/api/auth/*` (except `DELETE /api/auth/session`) return 503 (fail closed). Details: [`../specs/passkey/security.md`](../specs/passkey/security.md).
- **Validation** — every request body and `:id` param is validated with Zod at the boundary; non-string, oversized or ill-formed (lone UTF-16 surrogate) fields and undecodable params return 400, never 500. Bodies over 10 kb return 413.
- **Win counting** — atomic: the leaderboard document ID is the normalized (lowercase) player name, percent-encoded so it is a valid Firestore ID (`bob smith` → `bob%20smith`; `.` and `_` are escaped too), and the increment runs in a Firestore transaction, so concurrent wins never lose a count or create duplicate rows.
- **Option dedupe** — race-safe: the duplicate check and insert run in one transaction.
- **Leaderboard query** — needs no composite Firestore index, so no index deployment is part of a release: query by `wins` desc with headroom, then tie-break on `lastWin` in memory and take 20.
- **Rate limiting** — `POST /api/leaderboard`: 10 req/min per IP. Admin endpoints (including verify): 30 req/min per IP, counted before the auth check. `/api/auth/*`: 10 req/min per IP, counted before the check. `trust proxy` hops come from `TRUSTED_PROXY_HOPS` (default 1). Counters are in-memory per instance.
- **CORS** — production is same-origin (the server also serves the client). Cross-origin access comes from the `CORS_ORIGINS` allow-list (comma-separated), defaulting to `http://localhost:5173` for the Vite dev server.
- **Client serving** — any GET outside `/api` that is not a static file returns `index.html` (SPA fallback); `index.html` is `no-cache` and hashed assets are cached immutably. Unknown `/api` routes still return the JSON 404.
- **Errors** — one error middleware logs the error server-side and returns a generic message; malformed JSON returns a JSON 400; unknown routes return a JSON 404.

### Data

Firestore collections `options` (`text`, `createdAt`) and `leaderboard` (`playerName`, `wins`, `lastWin`). Existing leaderboard documents with random IDs are re-keyed to normalized-name IDs by `server/src/scripts/migrateLeaderboard.ts` (merges duplicates by summing wins and keeping the latest `lastWin`); it defaults to a dry run.

Analytics collections: `analyticsEventBatches` (raw event batches), `analyticsDays/{day}/shards/{0–9}` (sharded daily totals, kept), `analyticsVisitorDays` (per-visitor daily funnel state) and `analyticsVisitors` (range-unique visitors). The raw batches and both visitor collections carry `expireAt` and expire by TTL after 30 days. See the analytics `data-model.md`.

### Known limitation

Win detection runs on the client, so the leaderboard is trust-based: anyone can POST a win. Rate limiting bounds abuse; the leaderboard is treated as cosmetic.

## Analytics

First-party, anonymous usage analytics. The client records a fixed set of events, the server validates, rate-limits and stores them in Firestore, and admins read the results at `/stats`. There is no third-party script, no cookie, and no IP address, `User-Agent` or player name is stored. The full contract and the acceptance criteria `AC-A1`–`AC-A19` live in [`../specs/analytics/`](../specs/analytics/README.md).

### Events

| Event | Properties | Fires when |
|---|---|---|
| `page_view` | `route`: `play` \| `leaderboard` \| `options` | A route renders: `/` → `play`, `/leaderboard` → `leaderboard`, `/cards` → `options`. `/stats`, the `/options` redirect and unknown paths are not tracked. Repeats of the same path are skipped. |
| `board_started` | — | A newly generated board is saved: first visit, **New Board** or **Play Again**. |
| `board_restored` | — | A saved board is loaded from `localStorage` on the first Play page mount of a page load. Navigating back to Play later in the same page load does not count. |
| `first_mark` | — | The first non-free cell is marked on a board; once per board. |
| `bingo` | — | A board becomes won for the first time; once per board. |
| `score_submitted` | — | `POST /api/leaderboard` succeeds. |
| `play_again` | — | **Play Again** is clicked in the win modal. |
| `outbound_click` | `placement`: `header` \| `footer` | A "Visit The Open website" link is clicked. |

The funnel counts unique visitors per day at each step: `visited` (any event) → `played` (`board_started` or `board_restored`) → `marked` (`first_mark`) → `won` (`bingo`) → `submitted` (`score_submitted`). Device type (`mobile`, `tablet`, `desktop`) is derived on the server from the `User-Agent`.

### Client

- **AN-1 Visitor ID** — a UUID v4 from `crypto.randomUUID()`, kept in `localStorage` under `bingoVisitorId` (in memory for the page session if storage is unavailable). It is not linked to a name, account or IP.
- **AN-2 Batching** — events queue in `client/src/services/analytics.ts` and are sent every 10 s while the queue is non-empty, immediately at 20 events, and with `fetch` `keepalive` when the page becomes hidden. Each event carries `offsetMs`, its age when the batch is sent (capped at 5 minutes).
- **AN-3 Never affects the game** — a failed, rejected or rate-limited send is dropped without retry or UI.
- **AN-4 Opt-outs** — with Global Privacy Control on (`navigator.globalPrivacyControl === true`) nothing is tracked and no visitor ID is created. A `410` from the server stops tracking for the rest of the page session. The tracker is a no-op under the Vitest `test` mode.

### Server

- **AN-5 Request order** — `POST /api/analytics/events` runs: kill switch (`410` unless `ANALYTICS_ENABLED` is the string `true`) → 10 kb body limit (`413`) → bot filter (missing or bot `User-Agent` returns `204` and stores nothing) → per-IP limit (600 req/min) → per-visitor limit (20 req/min per `visitorId`) → strict Zod validation (`400`) → record.
- **AN-6 Recording** — the server clock is authoritative: events are bucketed by receive time in `America/Los_Angeles`; `offsetMs` only orders events within a batch. One Firestore transaction writes the raw batch, increments one random counter shard for the day, records funnel steps and device once per visitor per day, and enforces the cap of 500 events per visitor per day exactly (`429` with nothing written when exceeded).
- **AN-7 Summary** — `GET /api/admin/analytics?days=1|7|30` (admin auth, admin rate limit) sums the shards for each day in the range, zero-fills missing days, counts range-unique visitors with a Firestore `count()` query, caches completed days for the life of the instance and whole responses for 30 s. It keeps working when collection is off.
- **AN-8 Limits are per instance** — rate-limit counters are in memory; with up to 2 App Hosting instances the effective per-IP and per-visitor ceilings can be up to 2× the configured values. The daily cap lives in Firestore and is exact.

### Dashboard (`/stats`)

- **AN-9 Access** — no nav link; admins visit `/stats` directly. It shows the shared unlock screen (subtitle "Unlock to view the usage stats.") until the admin session is verified. The session is shared with `/cards`, so unlocking either page unlocks both. A `401` returns to the unlock screen (AC-O5).
- **AN-10 Content** — range presets **Today**, **Last 7 days** (default) and **Last 30 days**, in LA days including today. KPI tiles (unique visitors, boards started, bingos, scores submitted); the funnel with each step's percentage of `visited`; activity by hour of day with a table alternative; a per-day table of every event plus unique visitors; page views by route (`options` is labelled **Cards**), outbound clicks by placement and visitors by device.
- **AN-11 Refresh** — every 60 s and on **Refresh**. Refreshes and range changes keep the previous numbers on screen ("Updating..." during a range change); a failed refresh shows an error note above the existing numbers and never shows zeros. At 375 px the grids collapse to one column, tiles go two across, and the per-day table scrolls sideways with a sticky Day column.

### Operations

- **AN-12 Switch** — `ANALYTICS_ENABLED` is a plain environment variable: `"true"` in `apphosting.yaml` while collecting, `false` in `server/.env.example`. Setting it to `"false"` and pushing turns collection off; `/stats` keeps showing the stored totals.
- **AN-13 Retention** — raw batches, visitor-day and visitor documents carry `expireAt` (30 days, `ANALYTICS_RAW_RETENTION_DAYS`) and are deleted by Firestore TTL policies, which are `ACTIVE` on `bingo-e1be7`. Daily shard totals are kept. The policy commands, including a REST fallback for older `gcloud` versions, are in the analytics `data-model.md`.
- **AN-14 Export** — `npm run analytics:export -w server -- --from YYYY-MM-DD --to YYYY-MM-DD [--out file.jsonl]` writes one JSON line per raw event for the LA-day range (default file `analytics-<from>_<to>.jsonl`). It is read-only and refuses to run against a real project without `--yes`.
- **AN-15 Shared venue Wi-Fi** — the analytics per-IP limit allows about 100 active players behind one IP. `POST /api/leaderboard` stays at 10 req/min per IP, so more than 10 winners a minute on one network would get `429`s.
