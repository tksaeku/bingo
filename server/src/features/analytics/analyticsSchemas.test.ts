import { describe, expect, it } from 'vitest';
import { analyticsSummaryQuerySchema, eventBatchSchema } from './analyticsSchemas';

const VISITOR_ID = '3f1c2a9e-8b7d-4c1e-9f2a-6d5b4c3a2b1e';

function batch(overrides: Record<string, unknown> = {}): unknown {
  return { visitorId: VISITOR_ID, events: [{ name: 'board_started', offsetMs: 10 }], ...overrides };
}

describe('eventBatchSchema', () => {
  it('accepts every catalogue event with its properties', () => {
    const events = [
      { name: 'page_view', offsetMs: 0, properties: { route: 'play' } },
      { name: 'outbound_click', offsetMs: 300_000, properties: { placement: 'footer' } },
      ...['board_started', 'board_restored', 'first_mark', 'bingo', 'score_submitted', 'play_again'].map((name) => ({ name, offsetMs: 5 })),
    ];
    expect(eventBatchSchema.safeParse(batch({ events })).success).toBe(true);
  });

  it('accepts exactly 20 events', () => {
    const events = Array.from({ length: 20 }, () => ({ name: 'bingo', offsetMs: 1 }));
    expect(eventBatchSchema.safeParse(batch({ events })).success).toBe(true);
  });

  it.each([
    ['unknown top-level key', batch({ extra: 1 })],
    ['unknown event key', batch({ events: [{ name: 'bingo', offsetMs: 1, extra: 1 }] })],
    ['missing visitorId', { events: [{ name: 'bingo', offsetMs: 1 }] }],
    ['uppercase UUID', batch({ visitorId: VISITOR_ID.toUpperCase() })],
    ['non-v4 UUID', batch({ visitorId: '3f1c2a9e-8b7d-1c1e-9f2a-6d5b4c3a2b1e' })],
    ['bad UUID variant', batch({ visitorId: '3f1c2a9e-8b7d-4c1e-1f2a-6d5b4c3a2b1e' })],
    ['visitorId with a lone surrogate', batch({ visitorId: `${VISITOR_ID.slice(0, 35)}\uD800` })],
    ['zero events', batch({ events: [] })],
    ['21 events', batch({ events: Array.from({ length: 21 }, () => ({ name: 'bingo', offsetMs: 1 })) })],
    ['missing events', { visitorId: VISITOR_ID }],
    ['negative offset', batch({ events: [{ name: 'bingo', offsetMs: -1 }] })],
    ['offset above 300000', batch({ events: [{ name: 'bingo', offsetMs: 300_001 }] })],
    ['fractional offset', batch({ events: [{ name: 'bingo', offsetMs: 1.5 }] })],
    ['missing offset', batch({ events: [{ name: 'bingo' }] })],
    ['unknown event name', batch({ events: [{ name: 'click', offsetMs: 1 }] })],
    ['page_view without properties', batch({ events: [{ name: 'page_view', offsetMs: 1 }] })],
    ['page_view with bad route', batch({ events: [{ name: 'page_view', offsetMs: 1, properties: { route: 'stats' } }] })],
    ['page_view with extra property', batch({ events: [{ name: 'page_view', offsetMs: 1, properties: { route: 'play', x: 1 } }] })],
    ['page_view with a lone-surrogate route', batch({ events: [{ name: 'page_view', offsetMs: 1, properties: { route: '\uD800' } }] })],
    ['outbound_click without properties', batch({ events: [{ name: 'outbound_click', offsetMs: 1 }] })],
    ['outbound_click with bad placement', batch({ events: [{ name: 'outbound_click', offsetMs: 1, properties: { placement: 'body' } }] })],
    ['bingo with properties', batch({ events: [{ name: 'bingo', offsetMs: 1, properties: {} }] })],
    ['non-object event', batch({ events: ['bingo'] })],
    ['non-object body', 'hello'],
  ])('rejects %s', (_label, body) => {
    expect(eventBatchSchema.safeParse(body).success).toBe(false);
  });
});

describe('analyticsSummaryQuerySchema', () => {
  it.each([['1', 1], ['7', 7], ['30', 30]])('parses days=%s', (value, expected) => {
    expect(analyticsSummaryQuerySchema.parse({ days: value })).toEqual({ days: expected });
  });

  it.each([[{}], [{ days: '2' }], [{ days: '' }], [{ days: '07' }], [{ days: ['7', '30'] }], [{ days: 7 }]])('rejects %j', (query) => {
    expect(analyticsSummaryQuerySchema.safeParse(query).success).toBe(false);
  });
});
