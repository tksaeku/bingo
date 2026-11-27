# Analytics — data model

All analytics data lives in the existing `(default)` Firestore database (us-east4). `firestore.rules` already denies all client access; only the server's Admin SDK reads and writes these collections. `server/src/repositories/FirestoreAnalyticsRepository.ts` is the only code that touches them, with typed converters mapping `Timestamp` ↔ ISO strings like the existing repositories.

"Day" always means an `America/Los_Angeles` calendar day written as `YYYY-MM-DD`, computed from the server's receive time (AC-A8). "Hour" is the LA hour, `00`–`23`.

## Collections

### `analyticsEventBatches/{autoId}` — raw data, expires

One document per accepted batch (not per event), which keeps writes roughly 5–10× lower than one document per event.

| Field | Type | Notes |
|---|---|---|
| `visitorId` | string | |
| `day` | string | LA day of `receivedAt` |
| `receivedAt` | Timestamp | Server time |
| `deviceType` | `mobile` \| `tablet` \| `desktop` | Derived from `User-Agent`; the raw UA is not stored |
| `events` | array of `{ name, properties?, occurredAt: Timestamp }` | `occurredAt = receivedAt − offsetMs` |
| `expireAt` | Timestamp | `receivedAt + 30 days`. TTL field. |

Used only by the export script (AC-A19), which queries `where('day', '>=', from).where('day', '<=', to)`. That's a range on a single field, so it uses the automatic index; no composite index is needed.

### `analyticsDays/{day}/shards/{0–9}` — daily totals, kept

Each accepted batch increments **one randomly chosen shard** of that day with `FieldValue.increment`, so bursts of traffic don't all contend on one document. The dashboard sums the 10 shards. The parent `analyticsDays/{day}` document is never written; shards are read by their full paths with `getAll`.

| Field path | Incremented by |
|---|---|
| `events.<eventName>` | Each event in the batch |
| `pageViews.<route>` | Each `page_view` |
| `outboundClicks.<placement>` | Each `outbound_click` |
| `hourly.<HH>` | Each event, by the LA hour of `receivedAt` |
| `funnel.<step>` | 1, when this batch is the visitor's first to reach that step today |
| `devices.<deviceType>` | 1, when this batch is the visitor's first of the day |
| `updatedAt` | Set to `receivedAt` |

These documents hold only counts, so they have no TTL and stay after the event.

### `analyticsVisitorDays/{day}_{visitorId}` — per-visitor daily state, expires

| Field | Type | Notes |
|---|---|---|
| `visitorId` | string | |
| `day` | string | |
| `deviceType` | string | From the visitor's first batch of the day |
| `steps` | map of `step → true` | Funnel steps reached today (`visited`, `played`, `marked`, `won`, `submitted`) |
| `eventCount` | number | Events accepted today; enforces the daily cap |
| `expireAt` | Timestamp | `receivedAt + 30 days`. TTL field. |

### `analyticsVisitors/{visitorId}` — range-unique visitors, expires

| Field | Type | Notes |
|---|---|---|
| `lastSeenDay` | string | Written with `set(..., { merge: true })` on the visitor's first batch each day |
| `expireAt` | Timestamp | `receivedAt + 30 days`. TTL field. |

`uniqueVisitors` for a range is `count()` on `analyticsVisitors` where `lastSeenDay >= fromDay`. Every dashboard range ends today, so this is exactly "visitors seen in the range". It's a single-field range, so it needs no composite index, and an aggregation query costs about one read per 1,000 matching documents.

## Recording one batch

One Firestore **transaction** per accepted batch:

1. Read `analyticsVisitorDays/{day}_{visitorId}`.
2. If `eventCount + events.length` exceeds the daily cap (500), abort and return `daily_cap_exceeded` → the handler answers `429`.
3. Work out which funnel steps this batch reaches for the first time today, and whether it's the visitor's first batch today.
4. Write, all in the same transaction:
   - a new `analyticsEventBatches` document;
   - increments on one random shard of `analyticsDays/{day}` (events, page views, clicks, hourly, plus new funnel steps and the device on first batch);
   - the updated `analyticsVisitorDays` document (`steps`, `eventCount`, `expireAt`, and `deviceType` on first batch);
   - on the first batch of the day only, `analyticsVisitors/{visitorId}` with `lastSeenDay` and `expireAt`.

The transaction makes funnel and device counts exact: two batches from the same visitor racing on different instances can't both count the same step. Contention is limited to one visitor's own document.

## Reading the summary

- **Past days** never change once the LA day is over, because batches are bucketed by receive time. The service caches completed days in memory for the life of the instance.
- **Today** is re-read on each uncached request: 10 shard reads plus one `count()`. The whole response is cached for 30 s per `days` value.
- Missing shards and fields count as zero. The service zero-fills every key before responding.

## TTL policies

Firestore deletes expired documents in the background, typically within 24 hours after `expireAt`. Deletes are billed like normal deletes. Set the policy once per collection group:

```bash
gcloud firestore fields ttls update expireAt --collection-group=analyticsEventBatches --enable-ttl --project=bingo-e1be7
gcloud firestore fields ttls update expireAt --collection-group=analyticsVisitorDays --enable-ttl --project=bingo-e1be7
gcloud firestore fields ttls update expireAt --collection-group=analyticsVisitors --enable-ttl --project=bingo-e1be7
```

The 30-day retention is the `ANALYTICS_RAW_RETENTION_DAYS` server constant. It only applies to documents written after a change.

## Capacity and cost estimate

Assumptions, per day at peak: 1,500 visitors, about 25 events each, sent in about 8 batches.

| | Per day | Free quota | Notes |
|---|---|---|---|
| Writes | ~37,500 (3 per batch × 12,000 batches, + 1,500 visitor docs) | 20,000 | Over the free quota; the excess is billed |
| Reads | ~12,000 (1 per batch) + dashboard | 50,000 | Dashboard adds ~11 reads per uncached refresh |
| Storage | A few MB | 1 GiB | |
| TTL deletes | Same as raw writes, 30 days later | 20,000 | |

App Hosting already requires the Blaze plan, so usage over the free quota is billed. At current Firestore rates (roughly $0.18 per 100,000 writes; check the Firebase pricing page for us-east4), the excess is a few cents a day.

Shard count (`ANALYTICS_COUNTER_SHARDS = 10`) handles about 10 sustained batch writes per second. That's far above the expected peak, since a batch is only sent when a player does something.
