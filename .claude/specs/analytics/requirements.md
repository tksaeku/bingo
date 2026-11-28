# Analytics — requirements

## Goals

Answer these questions for each day of the event:

1. How many people visited, and how many actually played?
2. How far do players get: started a board → marked a cell → got bingo → submitted a score?
3. When during the day do people play?
4. Phone, tablet or desktop?
5. Do people look at the leaderboard, and do they click through to The Open's website?
6. Do players come back to a saved board?

## Event catalogue

Every event carries the visitor ID and an event name. Only the properties listed here are allowed; anything else is rejected (see [`api.md`](api.md)).

| Event | Properties | Fires when |
|---|---|---|
| `page_view` | `route`: `play` \| `leaderboard` \| `options` | The app renders a route, including the first render. Not for `/stats`, and not for the `*` redirect (the redirect's target fires instead). |
| `board_started` | — | A newly generated board is saved: first visit, **New Board**, or **Play Again**. |
| `board_restored` | — | A valid saved board is loaded from `localStorage` on page load. |
| `first_mark` | — | The first non-free cell is marked on a board. Once per board; a restored board that already has a marked cell never fires it. |
| `bingo` | — | A board becomes won for the first time (the same moment the win modal is scheduled to open). Once per board. |
| `score_submitted` | — | `POST /api/leaderboard` succeeds. |
| `play_again` | — | **Play Again** is clicked in the win modal. |
| `outbound_click` | `placement`: `header` \| `footer` | A "Visit The Open website" link is clicked. |

Device type (`mobile` \| `tablet` \| `desktop`) is derived on the server from the `User-Agent` header, never sent by the client.

### Funnel steps

Each step counts **unique visitors per day** who reached it:

| Step | Reached by |
|---|---|
| `visited` | Any event |
| `played` | `board_started` or `board_restored` |
| `marked` | `first_mark` |
| `won` | `bingo` |
| `submitted` | `score_submitted` |

## Acceptance criteria

### Collection (client)

- **AC-A1** The client sends only catalogue events, with only the listed properties and values.
- **AC-A2** Events are queued and sent in batches: every 10 s while the queue is non-empty, immediately once it holds 20 events, and when the page becomes hidden (`visibilitychange` → `hidden`, sent with `fetch` `keepalive`). The queue holds at most 100 events; beyond that the oldest are dropped.
- **AC-A3** Tracking never affects the game. A failed, rejected or rate-limited send is dropped without retrying, shows nothing in the UI, and never throws into React.
- **AC-A4** The visitor ID is a UUID v4 generated once with `crypto.randomUUID()` and kept in `localStorage` under `bingoVisitorId`. If `localStorage` is unavailable, an in-memory ID is used for the page session.
- **AC-A5** Each occurrence is tracked exactly once, including under React StrictMode's double-run of effects in development.
- **AC-A6** When the server answers `410` (collection switched off), the client stops queueing and sending for the rest of the page session.

### Ingestion (server)

- **AC-A7** `POST /api/analytics/events` validates the whole batch with Zod (see [`api.md`](api.md)). An invalid batch returns `400` and nothing from it is stored.
- **AC-A8** The server's clock is authoritative. Events are bucketed by the time the server receives the batch, in `America/Los_Angeles`. Client-side offsets are only used to order events within a batch.
- **AC-A9** Requests whose `User-Agent` is missing or matches the bot pattern return `204` and are not stored.
- **AC-A10** Requests are rate limited per visitor and per IP, and each visitor has a daily event cap (see [`abuse-and-privacy.md`](abuse-and-privacy.md)). Over-limit requests return `429` and are not stored.
- **AC-A11** A stored batch writes: one raw batch document with an `expireAt` for TTL, one increment on a random counter shard for that day, and a visitor-day document only when the visitor reaches a funnel step for the first time that day (see [`data-model.md`](data-model.md)). All writes for a batch are committed in one Firestore transaction.
- **AC-A12** When `ANALYTICS_ENABLED` is not `true`, the endpoint returns `410` and writes nothing. The admin read endpoint keeps working so past data stays viewable.
- **AC-A13** A Firestore failure returns the generic `500` from the existing error middleware and is logged server-side.

### Dashboard (`/stats`)

- **AC-A14** `/stats` shows the admin unlock screen until the admin session is verified, then the dashboard. Like `/cards`, it has no nav link and shares the same admin session, so unlocking either page unlocks both. A `401` returns to the unlock screen (same as AC-O5).
- **AC-A15** Range presets: **Today**, **Last 7 days** (default), **Last 30 days**. Days are `America/Los_Angeles` days and include today.
- **AC-A16** The dashboard shows, for the selected range:
  - KPI tiles: unique visitors, boards started, bingos, scores submitted.
  - A funnel of unique visitors per step (`visited` → `played` → `marked` → `won` → `submitted`), with each step's percentage of `visited`.
  - Activity by hour of day (all events, `America/Los_Angeles`), as a bar chart with a table alternative.
  - A per-day table: one row per day, one column per event, plus unique visitors.
  - Page views by route, outbound clicks by placement, and unique visitors by device type.
- **AC-A17** It refreshes every 60 s and has a **Refresh** button. Refreshes don't blank the page; only the first load shows a loading state. A failed fetch shows an error, not zeros.
- **AC-A18** Charts are readable without color alone and each has an accessible table or text equivalent.

### Export

- **AC-A19** `npm run analytics:export -w server -- --from YYYY-MM-DD --to YYYY-MM-DD [--out file.jsonl]` writes one JSON line per raw event (batch fields flattened onto each event) for the given LA-day range. It is read-only and refuses to run against a real project without `--yes`, like `seed`.
