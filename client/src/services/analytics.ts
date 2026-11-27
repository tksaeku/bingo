import {
  ANALYTICS_FLUSH_INTERVAL_MS,
  ANALYTICS_MAX_BATCH_SIZE,
  ANALYTICS_MAX_OFFSET_MS,
  ANALYTICS_MAX_QUEUE_SIZE,
} from '../constants';
import type { AnalyticsEvent, AnalyticsEventPayload } from '../types';
import { analyticsApi } from './api';
import { getVisitorId } from './visitorIdStorage';

/** HTTP status the server answers when collection is switched off. */
const COLLECTION_OFF_STATUS = 410;

interface QueuedEvent {
  event: AnalyticsEvent;
  queuedAtMs: number;
}

let queue: QueuedEvent[] = [];
let flushTimerId: ReturnType<typeof setTimeout> | null = null;
let isCollectionOff = false;
let isListeningForVisibility = false;

/** True when this browser asks not to be tracked, or the app runs under a test runner. */
function getIsTrackingDisabled(): boolean {
  if (import.meta.env.MODE === 'test') {
    return true;
  }
  return (
    typeof navigator !== 'undefined' &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}

/** Clamps an event's age to the range the server accepts, as a whole number. */
function getOffsetMs(queuedAtMs: number, sendTimeMs: number): number {
  return Math.min(ANALYTICS_MAX_OFFSET_MS, Math.max(0, Math.round(sendTimeMs - queuedAtMs)));
}

function clearFlushTimer(): void {
  if (flushTimerId !== null) {
    clearTimeout(flushTimerId);
    flushTimerId = null;
  }
}

function scheduleFlush(): void {
  if (flushTimerId === null && queue.length > 0) {
    flushTimerId = setTimeout(() => flush(false), ANALYTICS_FLUSH_INTERVAL_MS);
  }
}

/** Sends one batch; failures are dropped and a 410 switches tracking off. */
async function sendBatch(events: AnalyticsEventPayload[], isKeepalive: boolean): Promise<void> {
  try {
    const status = await analyticsApi.sendEvents({ visitorId: getVisitorId(), events }, { keepalive: isKeepalive });
    if (status === COLLECTION_OFF_STATUS) {
      isCollectionOff = true;
      queue = [];
      clearFlushTimer();
    }
  } catch {
    // Tracking never affects the game; a failed batch is dropped.
  }
}

/** Takes up to one batch off the queue and sends it; anything left waits for the next flush. */
function flush(isKeepalive: boolean): void {
  clearFlushTimer();
  if (isCollectionOff || queue.length === 0) {
    return;
  }
  const sendTimeMs = Date.now();
  const batch = queue.slice(0, ANALYTICS_MAX_BATCH_SIZE);
  queue = queue.slice(ANALYTICS_MAX_BATCH_SIZE);
  const events = batch.map(({ event, queuedAtMs }): AnalyticsEventPayload => ({
    ...event,
    offsetMs: getOffsetMs(queuedAtMs, sendTimeMs),
  }));
  scheduleFlush();
  void sendBatch(events, isKeepalive);
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    flush(true);
  }
}

/** Queues one analytics event; never throws and never blocks the caller. */
export function trackEvent(event: AnalyticsEvent): void {
  try {
    if (isCollectionOff || getIsTrackingDisabled()) {
      return;
    }
    if (!isListeningForVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      isListeningForVisibility = true;
    }
    queue.push({ event, queuedAtMs: Date.now() });
    if (queue.length > ANALYTICS_MAX_QUEUE_SIZE) {
      queue = queue.slice(queue.length - ANALYTICS_MAX_QUEUE_SIZE);
    }
    if (queue.length >= ANALYTICS_MAX_BATCH_SIZE) {
      flush(false);
      return;
    }
    scheduleFlush();
  } catch {
    // Tracking must never throw into the caller.
  }
}

/** Clears all tracker state and listeners. Test seam: lets each test start from a fresh tracker. */
export function resetAnalyticsTracker(): void {
  clearFlushTimer();
  queue = [];
  isCollectionOff = false;
  if (isListeningForVisibility) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    isListeningForVisibility = false;
  }
}
