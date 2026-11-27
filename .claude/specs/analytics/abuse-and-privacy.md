# Analytics — abuse controls and privacy

`POST /api/analytics/events` is public and unauthenticated, like `POST /api/leaderboard`. Anyone can send events, so the data is trust-based, the same as the leaderboard. These controls cap how much damage forged traffic can do, protect the Firestore budget, and keep a single bad client from skewing the numbers much.

## Layers, in request order

| # | Control | Limit | Response | Why |
|---|---|---|---|---|
| 1 | Kill switch | `ANALYTICS_ENABLED !== 'true'` | `410` | Collection is off outside the event, and locally by default. Checked first, so a switched-off server does no work. |
| 2 | Body size | 10 kb (existing `JSON_BODY_LIMIT`) | `413` | A full 20-event batch is about 1.5 kb. |
| 3 | Bot filter | `User-Agent` missing or matching the bot pattern | `204`, not stored | Crawlers and link previewers. A silent `204` gives scripted senders no signal to adapt to. |
| 4 | Per-IP rate limit | 600 requests/min | `429` | Stops one machine flooding the endpoint. Deliberately high; see "Shared venue Wi-Fi" below. |
| 5 | Per-visitor rate limit | 20 requests/min per `visitorId` | `429` | A normal client sends at most about 6 batches/min (10 s flush) plus a few page-hidden flushes. |
| 6 | Schema validation | See [`api.md`](api.md): fixed event names, enum properties, 1–20 events, UUID v4 visitor ID, strict objects | `400` | Nothing free-form is stored, so the data can't carry arbitrary text, names or scripts. |
| 7 | Daily event cap | 500 events per visitor per LA day, enforced exactly in the recording transaction | `429` | Bounds how far one visitor ID can skew totals. A heavy real player stays around 50–100. |

## Rate-limiter details

- Both limiters use the existing `createRateLimiter` pattern (`express-rate-limit` v8, `draft-8` headers, JSON `429` body). Add a variant that accepts a `keyGenerator`.
- **Per-IP key:** `express-rate-limit`'s `ipKeyGenerator(req.ip)`, which groups IPv6 addresses by subnet. `req.ip` honors the existing `TRUSTED_PROXY_HOPS` setting.
- **Per-visitor key:** `visitor:<visitorId>` when `req.body.visitorId` is a valid UUID v4. Otherwise it falls back to the IP key, so a malformed body can't skip the limiter. The limiter runs after `express.json()`, so the body is already parsed.
- Counters are in memory, per instance. `apphosting.yaml` allows up to 2 instances, so the effective ceiling can be up to 2× the configured limit. That's acceptable for cosmetic data; the exact daily cap (layer 7) lives in Firestore and doesn't have this gap.
- A forged sender can rotate visitor IDs to dodge layers 5 and 7. Layer 4 still caps it at 600 req/min per IP × 20 events. If that ever matters, the next step is a Firestore-backed global daily ceiling. It's out of scope for now.

### Shared venue Wi-Fi

At the event, many players may share one public IP behind the venue's NAT. A strict per-IP limit would block everyone on that network at once. The per-IP limit is therefore set for about 100 simultaneously active players behind one IP (600 ÷ 6 batches/min), and per-visitor limiting does the real work.

The existing `POST /api/leaderboard` limit (10/min per IP) has the same exposure: more than 10 winners per minute on venue Wi-Fi would get `429`s. It's outside this feature's scope; review it before the event.

## Bot pattern

Case-insensitive match on the `User-Agent`:

```
bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|curl|wget|python-requests|httpclient|okhttp|go-http-client|node-fetch|axios/|postman
```

This catches honest automation only; a deliberate abuser can send a browser UA. That's what the rate limits are for.

## Device type

Derived on the server from the `User-Agent` and stored as `mobile`, `tablet` or `desktop`:

- `tablet`: `iPad`, `Tablet`, or `Android` without `Mobile`. iPadOS reports a Mac UA, so it shows as desktop; that's accepted.
- `mobile`: `Mobi`, `iPhone`, `iPod`, or `Android` with `Mobile`.
- `desktop`: everything else.

No UA-parsing dependency is added.

## Privacy

| Rule | How |
|---|---|
| No IP addresses stored | IPs exist only in the rate limiter's in-memory counters, which expire after one minute. |
| No `User-Agent` stored | Only the derived device type is kept. |
| No player names or free text | `score_submitted` has no properties; every property is an enum. |
| Anonymous visitor ID | A random UUID made on the device. It isn't linked to a name, account or IP. Clearing site data resets it. |
| Raw data expires | Raw batches and visitor documents are deleted by TTL 30 days after they were written. Only aggregate counts are kept. |
| No third parties | Events go to this app's own `/api`; nothing is shared or sold. |
| No cookies | The visitor ID is in `localStorage`, read only by the app's own script. |
| Global Privacy Control respected | When `navigator.globalPrivacyControl === true`, the client tracks nothing and creates no visitor ID. |

This is a low-risk, first-party, anonymous setup, but it isn't legal advice. Whether a privacy notice is needed depends on where visitors are and on rules that apply to The Open. A one-line footer note ("Anonymous usage stats help us improve the game") is cheap and is in [`tasks.md`](tasks.md) as optional.

## Public repo

Nothing in this feature is secret. `ANALYTICS_ENABLED` is a plain env var in `apphosting.yaml`, not a Secret Manager secret.
