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

- **AC-O1** Option writes require the admin key. The header has no link to the cards page; admins reach it by visiting `/cards` directly.
- **AC-O2** Visiting `/cards` (the admin page for the option pool, shown to players as "cards"; `/options` redirects there) without a key shows an admin-key form. The key is verified against the server before it is stored; a wrong key shows an error.
- **AC-O3** Admins can add an option (1–100 characters after trimming) and delete an option. Duplicates (case-insensitive, trimmed) are rejected with a clear message.
- **AC-O4** Adding/deleting does not blank the list or steal focus from the input; buttons are disabled while a request is in flight. Deletion asks for confirmation with an in-page control (no `window.confirm`/`alert`).
- **AC-O5** A 401 from the server clears the stored key and returns to the key form.

## API contract

Base path `/api`. All bodies are JSON. All errors are `{ "error": string }` (plus optional `"details"` for validation errors). Timestamps are ISO-8601 strings.

| Method & path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /api/health` | — | — | `200 { "status": "ok" }` | — |
| `GET /api/options` | — | — | `200 Option[]` ordered by `createdAt` asc | 500 |
| `POST /api/options` | admin | `{ "text": string }` 1–100 chars trimmed | `201 Option` | 400 invalid, 401, 409 duplicate, 422 pool full (200 options), 429, 503 admin key not configured |
| `DELETE /api/options/:id` | admin | — | `204` | 400 bad id, 401, 404, 429, 503 |
| `GET /api/admin/verify` | admin | — | `204` | 401, 503 |
| `GET /api/leaderboard` | — | — | `200 LeaderboardEntry[]` (max 20, order per AC-L1) | 500 |
| `POST /api/leaderboard` | — | `{ "playerName": string }` 1–20 chars after normalization | `200 LeaderboardEntry` (updated entry) | 400, 429 |

- **Option** — `id` (string), `text` (string), `createdAt` (ISO string).
- **LeaderboardEntry** — `id` (string), `playerName` (string), `wins` (number), `lastWin` (ISO string).

The client mirrors these in `client/src/types.ts`; the server defines them in `server/src/types.ts`.

### Server rules

- **Admin auth** — header `x-admin-key`, compared to `ADMIN_KEY` with a constant-time comparison. If `ADMIN_KEY` is unset, admin endpoints return 503 (fail closed).
- **Validation** — every request body and `:id` param is validated with Zod at the boundary; non-string, oversized or ill-formed (lone UTF-16 surrogate) fields and undecodable params return 400, never 500. Bodies over 10 kb return 413.
- **Win counting** — atomic: the leaderboard document ID is the normalized (lowercase) player name, percent-encoded so it is a valid Firestore ID (`bob smith` → `bob%20smith`; `.` and `_` are escaped too), and the increment runs in a Firestore transaction, so concurrent wins never lose a count or create duplicate rows.
- **Option dedupe** — race-safe: the duplicate check and insert run in one transaction.
- **Leaderboard query** — needs no composite Firestore index, so no index deployment is part of a release: query by `wins` desc with headroom, then tie-break on `lastWin` in memory and take 20.
- **Rate limiting** — `POST /api/leaderboard`: 10 req/min per IP. Admin endpoints (including verify): 30 req/min per IP, counted before the key check. `trust proxy` hops come from `TRUSTED_PROXY_HOPS` (default 1). Counters are in-memory per instance.
- **CORS** — production is same-origin (the server also serves the client). Cross-origin access comes from the `CORS_ORIGINS` allow-list (comma-separated), defaulting to `http://localhost:5173` for the Vite dev server.
- **Client serving** — any GET outside `/api` that is not a static file returns `index.html` (SPA fallback); `index.html` is `no-cache` and hashed assets are cached immutably. Unknown `/api` routes still return the JSON 404.
- **Errors** — one error middleware logs the error server-side and returns a generic message; malformed JSON returns a JSON 400; unknown routes return a JSON 404.

### Data

Firestore collections `options` (`text`, `createdAt`) and `leaderboard` (`playerName`, `wins`, `lastWin`). Existing leaderboard documents with random IDs are re-keyed to normalized-name IDs by `server/src/scripts/migrateLeaderboard.ts` (merges duplicates by summing wins and keeping the latest `lastWin`); it defaults to a dry run.

### Known limitation

Win detection runs on the client, so the leaderboard is trust-based: anyone can POST a win. Rate limiting bounds abuse; the leaderboard is treated as cosmetic.
