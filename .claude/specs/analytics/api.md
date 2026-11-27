# Analytics — API contract

Same conventions as the main API in [`../../docs/spec.md`](../../docs/spec.md): base path `/api`, JSON bodies, errors are `{ "error": string }` (plus optional `"details"` for validation errors), 10 kb body limit (`413` above it).

| Method & path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /api/analytics/events` | — | `EventBatch` | `204` (stored, or dropped as a bot) | 400 invalid, 410 collection off, 413, 429, 500 |
| `GET /api/admin/analytics?days=1\|7\|30` | admin | — | `200 AnalyticsSummary` | 400 bad `days`, 401, 429, 503 admin key not configured, 500 |

## `POST /api/analytics/events`

### Request — `EventBatch`

```jsonc
{
  "visitorId": "3f1c2a9e-8b7d-4c1e-9f2a-6d5b4c3a2b1e", // UUID v4, lowercase
  "events": [
    { "name": "page_view", "offsetMs": 8200, "properties": { "route": "play" } },
    { "name": "board_started", "offsetMs": 8150 },
    { "name": "first_mark", "offsetMs": 1200 }
  ]
}
```

Validation (Zod, `.strict()` objects, so unknown keys fail):

| Field | Rule |
|---|---|
| `visitorId` | String matching UUID v4 (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/`) |
| `events` | Array, 1–20 items |
| `events[].name` | One of the catalogue names in [`requirements.md`](requirements.md) |
| `events[].offsetMs` | Integer, 0–300 000: milliseconds between the event happening and the batch being sent |
| `events[].properties` | Discriminated on `name`. `page_view` requires `{ route: "play" \| "leaderboard" \| "options" }`. `outbound_click` requires `{ placement: "header" \| "footer" }`. Every other event must omit `properties`. |

The server computes each event's `occurredAt` as `receivedAt − offsetMs` and stores it for ordering in raw data. Counters and day buckets use `receivedAt` (AC-A8).

### Responses

| Status | When |
|---|---|
| `204` | Batch stored, or dropped because the `User-Agent` is missing or looks like a bot (AC-A9). The client can't tell these apart, by design. |
| `400` | Validation failed. Nothing stored. |
| `410` | `ANALYTICS_ENABLED` is not `true`. Body `{ "error": "Analytics collection is off" }`. Checked before validation and rate limiting so a switched-off server does no work. |
| `429` | Per-IP or per-visitor rate limit, or the visitor's daily event cap (see [`abuse-and-privacy.md`](abuse-and-privacy.md)). Nothing stored. |
| `500` | Firestore failure. Generic message from the error middleware. |

Middleware order on the route: kill switch → bot filter → per-IP limiter → per-visitor limiter → handler (validate → service).

## `GET /api/admin/analytics`

Admin key in `x-admin-key`, counted by the existing admin limiter (30 req/min per IP) before the key check, like the other admin endpoints.

`days` is required and must be `1`, `7` or `30`. The range is the last `days` LA days ending today (`days=1` is today only).

The server caches each `days` response for 30 s per instance, so an open dashboard polling every 60 s and a few admins refreshing don't multiply Firestore reads.

### Response — `AnalyticsSummary`

```jsonc
{
  "timeZone": "America/Los_Angeles",
  "fromDay": "2026-11-20",
  "toDay": "2026-11-26",
  "generatedAt": "2026-11-26T19:04:11.000Z",
  "uniqueVisitors": 412,          // distinct visitor IDs seen in the range
  "totals": {                     // whole range
    "events": { "page_view": 2210, "board_started": 640, "board_restored": 188, "first_mark": 590,
                "bingo": 301, "score_submitted": 244, "play_again": 120, "outbound_click": 37 },
    "funnel": { "visited": 530, "played": 498, "marked": 470, "won": 280, "submitted": 231 },
    "pageViews": { "play": 1650, "leaderboard": 520, "options": 40 },
    "outboundClicks": { "header": 25, "footer": 12 },
    "devices": { "mobile": 470, "tablet": 18, "desktop": 42 },
    "hourly": [ 0, 0, 0, 0, 0, 0, 0, 2, 15, 40, ...24 numbers ]
  },
  "days": [                       // one entry per day in the range, oldest first, zero-filled
    { "day": "2026-11-20", "events": { ... }, "funnel": { ... }, "pageViews": { ... },
      "outboundClicks": { ... }, "devices": { ... }, "hourly": [ ...24 numbers ] }
  ]
}
```

- Every event, funnel step, route, placement and device key is always present (zero-filled), so the client never has to handle missing keys.
- `funnel` and `devices` count **visitor-days**: a visitor active on three days counts once per day. That's exact for `days=1`. For longer ranges, `uniqueVisitors` is the true distinct count; the dashboard labels funnel and device numbers as "daily visitors".
- `hourly[h]` is the number of events received in LA hour `h` (0–23).

The client mirrors `EventBatch`, the event union and `AnalyticsSummary` in `client/src/types.ts`; the server defines them in `server/src/types.ts`.
