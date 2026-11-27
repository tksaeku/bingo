import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAnalyticsTracker, trackEvent } from './analytics';

const mocks = vi.hoisted(() => ({ sendEvents: vi.fn() }));

vi.mock('./api', () => ({ analyticsApi: { sendEvents: mocks.sendEvents } }));

const FLUSH_MS = 10_000;

function setVisibility(state: 'hidden' | 'visible'): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

function sentBatch(callIndex = 0): { visitorId: string; events: Array<Record<string, unknown>> } {
  return mocks.sendEvents.mock.calls[callIndex][0];
}

describe('analytics tracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('MODE', 'development');
    mocks.sendEvents.mockReset();
    mocks.sendEvents.mockResolvedValue(204);
    resetAnalyticsTracker();
  });

  afterEach(() => {
    resetAnalyticsTracker();
    setVisibility('visible');
    vi.useRealTimers();
    vi.unstubAllEnvs();
    Reflect.deleteProperty(navigator, 'globalPrivacyControl');
  });

  describe('batching', () => {
    it('sends queued events 10 seconds after the first one', async () => {
      trackEvent({ name: 'board_started' });
      trackEvent({ name: 'page_view', properties: { route: 'play' } });

      await vi.advanceTimersByTimeAsync(FLUSH_MS - 1);
      expect(mocks.sendEvents).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(mocks.sendEvents).toHaveBeenCalledTimes(1);
      expect(sentBatch().events.map((event) => event.name)).toEqual(['board_started', 'page_view']);
      expect(mocks.sendEvents.mock.calls[0][1]).toEqual({ keepalive: false });
    });

    it('sends immediately when 20 events are queued and keeps the rest', async () => {
      for (let count = 0; count < 21; count += 1) {
        trackEvent({ name: 'first_mark' });
      }

      expect(mocks.sendEvents).toHaveBeenCalledTimes(1);
      expect(sentBatch().events).toHaveLength(20);

      await vi.advanceTimersByTimeAsync(FLUSH_MS);
      expect(mocks.sendEvents).toHaveBeenCalledTimes(2);
      expect(sentBatch(1).events).toHaveLength(1);
    });

    it('includes the visitor ID and event properties', async () => {
      trackEvent({ name: 'outbound_click', properties: { placement: 'footer' } });
      await vi.advanceTimersByTimeAsync(FLUSH_MS);

      expect(sentBatch().visitorId).toMatch(/^[0-9a-f-]{36}$/);
      expect(sentBatch().events[0]).toMatchObject({
        name: 'outbound_click',
        properties: { placement: 'footer' },
      });
    });
  });

  describe('page hidden', () => {
    it('flushes with keepalive', () => {
      trackEvent({ name: 'outbound_click', properties: { placement: 'header' } });

      setVisibility('hidden');

      expect(mocks.sendEvents).toHaveBeenCalledTimes(1);
      expect(mocks.sendEvents.mock.calls[0][1]).toEqual({ keepalive: true });
    });

    it('does nothing when the queue is empty', () => {
      setVisibility('hidden');

      expect(mocks.sendEvents).not.toHaveBeenCalled();
    });
  });

  describe('offsetMs', () => {
    it('is the event age at send time', async () => {
      trackEvent({ name: 'board_started' });
      await vi.advanceTimersByTimeAsync(FLUSH_MS);

      expect(sentBatch().events[0].offsetMs).toBe(FLUSH_MS);
    });

    it('is clamped to 300000', async () => {
      trackEvent({ name: 'board_started' });
      mocks.sendEvents.mockImplementation(() => new Promise(() => undefined));
      vi.setSystemTime(Date.now() + 600_000);
      setVisibility('hidden');

      expect(sentBatch().events[0].offsetMs).toBe(300_000);
    });
  });

  describe('failures', () => {
    it('swallows rejected sends without retrying', async () => {
      mocks.sendEvents.mockRejectedValue(new Error('offline'));
      trackEvent({ name: 'board_started' });

      await vi.advanceTimersByTimeAsync(FLUSH_MS);
      await vi.advanceTimersByTimeAsync(FLUSH_MS * 3);

      expect(mocks.sendEvents).toHaveBeenCalledTimes(1);
    });

    it('drops the batch on a 429 without retrying', async () => {
      mocks.sendEvents.mockResolvedValue(429);
      trackEvent({ name: 'board_started' });

      await vi.advanceTimersByTimeAsync(FLUSH_MS * 3);

      expect(mocks.sendEvents).toHaveBeenCalledTimes(1);
    });

    it('stops tracking for the session after a 410', async () => {
      mocks.sendEvents.mockResolvedValue(410);
      trackEvent({ name: 'board_started' });
      await vi.advanceTimersByTimeAsync(FLUSH_MS);

      trackEvent({ name: 'bingo' });
      await vi.advanceTimersByTimeAsync(FLUSH_MS * 2);

      expect(mocks.sendEvents).toHaveBeenCalledTimes(1);
    });
  });

  describe('flooding', () => {
    it('drains 100 events as five full batches while sends are still pending', () => {
      mocks.sendEvents.mockImplementation(() => new Promise(() => undefined));
      for (let count = 0; count < 100; count += 1) {
        trackEvent({ name: 'first_mark' });
      }

      expect(mocks.sendEvents).toHaveBeenCalledTimes(5);
      expect(mocks.sendEvents.mock.calls.every((call) => call[0].events.length === 20)).toBe(true);
    });
  });

  describe('not tracked', () => {
    it('sends nothing when Global Privacy Control is on', async () => {
      Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
      trackEvent({ name: 'board_started' });

      await vi.advanceTimersByTimeAsync(FLUSH_MS);

      expect(mocks.sendEvents).not.toHaveBeenCalled();
      expect(localStorage.getItem('bingoVisitorId')).toBeNull();
    });

    it('sends nothing under the test runner', async () => {
      vi.stubEnv('MODE', 'test');
      trackEvent({ name: 'board_started' });

      await vi.advanceTimersByTimeAsync(FLUSH_MS);

      expect(mocks.sendEvents).not.toHaveBeenCalled();
    });
  });
});
