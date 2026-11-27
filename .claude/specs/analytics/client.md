# Analytics — client

The client records events and shows the dashboard. Following the thin-client rule, every rule that matters (validation, limits, unique counts) is enforced on the server.

## Modules

| File | Responsibility |
|---|---|
| `services/visitorIdStorage.ts` | Reads or creates the visitor ID in `localStorage` under `bingoVisitorId` (AC-A4). Falls back to an in-memory ID when storage throws. Mirrors `boardStorage.ts`. |
| `services/analytics.ts` | The tracker: `trackEvent(event)`, the queue, flush timing, the `410` stop, the GPC check. No React. |
| `services/api.ts` | Gains `analyticsApi.sendEvents(batch, { keepalive })` and `analyticsApi.getSummary(adminKey, days)`. It stays the only file that makes HTTP calls. |
| `hooks/usePageViewTracking.ts` | Tracks `page_view` on route changes. Called once in `App`. |
| `hooks/useAnalyticsSummary.ts` | `{ data, loading, error, refetch }` for the dashboard, polling every 60 s. Built on `useAsyncResource` like `useLeaderboard`. |
| `pages/StatsPage/StatsPage.tsx` | Admin-key gate, then the dashboard. Mirrors `OptionsPage`. |
| `components/StatsDashboard/` | The dashboard and its subcomponents (see below). |
| `types.ts` | `AnalyticsEventName`, the `AnalyticsEvent` union, `EventBatch`, `AnalyticsSummary`, `FunnelStep`, `DeviceType`. |
| `constants.ts` | `VISITOR_ID_STORAGE_KEY`, `ANALYTICS_FLUSH_INTERVAL_MS = 10_000`, `ANALYTICS_MAX_BATCH_SIZE = 20`, `ANALYTICS_MAX_QUEUE_SIZE = 100`, `ANALYTICS_SUMMARY_REFRESH_INTERVAL_MS = 60_000`. |

## The tracker (`services/analytics.ts`)

```ts
/** Queues one analytics event; never throws and never blocks the caller. */
export function trackEvent(event: AnalyticsEvent): void;
```

- Each queued event records `Date.now()`. At send time, `offsetMs = sendTime − queuedTime`, clamped to 0–300 000.
- **Flushing (AC-A2):**
  - A 10 s timer starts when the first event enters an empty queue.
  - Reaching 20 events flushes immediately.
  - `visibilitychange` → `hidden` flushes with `keepalive: true`, so events like `outbound_click` still arrive when the page goes to the background.
  - A flush takes up to 20 events; anything left stays queued for the next flush.
- **Failures (AC-A3):** every send is wrapped. Any error, non-2xx status or `429` drops that batch. Nothing is retried, logged to the console in production, or shown in the UI.
- **Switched off (AC-A6):** a `410` sets a module flag. Later `trackEvent` calls do nothing and the queue is cleared.
- **Not tracked at all when:**
  - `navigator.globalPrivacyControl === true`;
  - running under Vitest. Tests mock `services/analytics` and assert on `trackEvent` calls; the tracker's own tests drive it with fake timers and a mocked `analyticsApi`.
- **Transport:** `analyticsApi.sendEvents` uses `fetch` with `keepalive` when it's set, and the shared axios instance otherwise. Keepalive requests have a 64 kb body cap, well above a full batch.
- **Dev:** the client sends to the local server, which answers `410` unless `ANALYTICS_ENABLED=true` is set there. A cross-origin keepalive request from the Vite dev server (`:5173` → `:5174`) may be dropped by the browser on page-hide. That's a dev-only gap; production is same-origin.

## Where each event fires

| Event | Where | Exactly-once rule (AC-A5) |
|---|---|---|
| `page_view` | `usePageViewTracking`, in an effect on `location.pathname` | Map `/` → `play`, `/leaderboard` → `leaderboard`, `/cards` → `options`. Skip anything else (`/stats`, `/options`, which redirects to `/cards`, and unknown paths that redirect). Keep the last tracked pathname in a ref and skip repeats, which also absorbs StrictMode's second effect run. |
| `board_restored` | `useBingoBoard`, on mount when `initialSavedBoard` is not null | Guard with a ref so StrictMode's second effect run doesn't fire it again. |
| `board_started` | `useBingoBoard`, in `generate()` right after `saveBoard(newBoard, false)` | Only after the `controller.signal.aborted` check, so the aborted first StrictMode run doesn't count. |
| `first_mark` | `useBingoBoard.toggleCell`, when a cell goes from unmarked to marked | Fire once per board. Use a per-board flag that starts `true` for a restored board with any marked non-free cell, and resets on `startNewBoard`. Unmarking and re-marking doesn't fire again. |
| `bingo` | `useBingoBoard.toggleCell`, in the branch that sets `isWinPending` (`!getHasWon(board) && !hasAutoOpenedWinModal`) | Inherits that branch's once-per-board rule. A restored board that is already won doesn't fire. |
| `score_submitted` | `BingoBoard.handleSubmitWin`, after `await submitWin(playerName)` resolves | Only on success. |
| `play_again` | `BingoBoard`, the handler passed to `WinModal` as `onPlayAgain` | Fire before `startNewBoard()`. The `board_started` that follows is tracked by the hook. |
| `outbound_click` | `App`: the header and footer "Visit The Open website" links, through `onClick` | `placement: 'header'` or `'footer'`. Don't `preventDefault`; the page-hidden flush sends it. |

The **New Board** button doesn't get its own event; the `board_started` it causes is enough.

## `/stats` page

- **Routing and nav (AC-A14):** add `<Route path="/stats" element={<StatsPage />} />`. There is no nav link; like `/cards`, admins visit the page directly.
- **Gate:** `StatsPage` uses `useAdminKey`. With no key it renders `AdminKeyForm`; a `401` from the summary endpoint calls `clearAdminKey(KEY_REJECTED_MESSAGE)`, as in `OptionsPage`.
- **Data (AC-A17):**
  - `useAnalyticsSummary(adminKey, days)` loads on mount and when `days` changes, and polls every 60 s.
  - Refetches keep the previous data on screen; only the first load shows a loading state.
  - An error shows a message (and keeps any stale data visible with a "couldn't refresh" note), never zeros.

### Components (`components/StatsDashboard/`)

Each component is a folder with `<Name>.tsx`, `<Name>.styles.ts` and `<Name>.test.tsx`.

| Component | Shows |
|---|---|
| `StatsDashboard` | Range presets (**Today** / **Last 7 days** / **Last 30 days**, a segmented control of buttons with `aria-pressed`), **Refresh**, a "last updated" time, and the sections below |
| `StatTiles` | Unique visitors, boards started, bingos, scores submitted |
| `FunnelChart` | Horizontal bars for `visited → played → marked → won → submitted`, each labelled with its count and percentage of `visited`, and labelled "daily visitors" for multi-day ranges |
| `HourlyActivityChart` | 24 vertical bars (LA hours), plus a visually hidden table with the same numbers |
| `DailyTable` | One row per day: unique visitors (that day's `funnel.visited`), then a column per event |
| `BreakdownList` | Reused three times: page views by route, outbound clicks by placement, daily visitors by device. Label, count and a proportional bar. |

- Charts are hand-built styled-components bars; no chart library is added.
- Bars carry their number as visible text, so color isn't the only cue (AC-A18).
- Colors come from `theme.ts`.
- All times are shown in LA time with the zone labelled ("Times in Pacific Time").

## Tests (co-located, Vitest + Testing Library)

- **`analytics.test.ts`:** batching at 10 s and at 20 events; hidden flush uses keepalive; failures swallowed; `410` stops tracking; GPC disables tracking; queue capped at 100 with the oldest dropped; `offsetMs` clamped.
- **`visitorIdStorage.test.ts`:** creates once, reuses, falls back when storage throws.
- **`usePageViewTracking`:** route mapping, `/stats` skipped, no duplicate under StrictMode.
- **`useBingoBoard` / `BingoBoard`:**
  - each event fires once at the right moment;
  - `first_mark` and `bingo` don't fire for restored boards that already have marks or are won;
  - `play_again` is followed by `board_started`.
- **`StatsPage` / `StatsDashboard`:**
  - key gate;
  - `401` returns to the form;
  - range switching refetches;
  - refresh doesn't blank;
  - an error shows an error, not zeros;
  - funnel percentages;
  - zero data renders cleanly.
