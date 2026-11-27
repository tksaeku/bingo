# Analytics — first-party usage tracking

First-party usage analytics for Bingo: the client records a small, fixed set of anonymous events, the server validates and rate-limits them and stores them in Firestore, and an admin-only `/stats` page shows the results. No third-party script, no cookies, no IP addresses or player names stored.

This spec is the acceptance criteria for dev and review agents, alongside the product spec in [`../../docs/spec.md`](../../docs/spec.md). When this feature ships, the parts that describe shipped behavior get folded into `docs/spec.md`.

## Files

| File | What it covers |
|---|---|
| [`requirements.md`](requirements.md) | Goals, scope, the event catalogue, and acceptance criteria (`AC-A*`) |
| [`api.md`](api.md) | `POST /api/analytics/events` and `GET /api/admin/analytics` contracts |
| [`data-model.md`](data-model.md) | Firestore collections, sharded counters, visitor docs, TTL, quota and cost math |
| [`abuse-and-privacy.md`](abuse-and-privacy.md) | Rate limiting, validation, bot filtering, the kill switch, and privacy rules |
| [`client.md`](client.md) | Visitor ID, the event queue, where each event fires, the `/stats` page |
| [`tasks.md`](tasks.md) | Groomed, ordered implementation tasks with done-criteria |

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Build vs. buy | Build it in this app | Free hosted tools limit the site count (Umami Hobby: 1 site) or need cookie consent (GA4). First-party `/api` calls aren't blocked by ad blockers. The server, validation, rate limiting and admin auth already exist. |
| Storage | Daily totals **and** raw event batches | Totals keep the dashboard cheap (it reads a fixed number of docs per day). Raw batches with a TTL allow ad-hoc digging through an export script during and after the event. |
| Unique visitors | Random UUID kept in `localStorage` | Stable across days on one browser, nothing personal, no IP hashing. |
| Dashboard | New admin `/stats` page | Uses the same admin key as the `/cards` page. Not linked in the nav; admins visit `/stats` directly. |
| Time zone for "days" | `America/Los_Angeles` | The Open is held in the LA area; day boundaries should match the event's local day. |
| Lifetime | Collect during the event week, then switch off | The `ANALYTICS_ENABLED` flag turns collection on and off without a code change. Raw data expires by TTL; daily totals are kept. |

## Out of scope

- Referrers, UTM campaigns, countries, browser/OS versions.
- New vs. returning visitors across days (board restores act as a partial stand-in).
- Session replay, heatmaps, error tracking.
- Real-time streaming. The dashboard refreshes on demand and every 60 s.
- Exporting to BigQuery or another warehouse. The export script writes JSON lines locally.
