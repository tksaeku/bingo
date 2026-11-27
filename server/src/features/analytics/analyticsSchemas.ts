import { z } from 'zod';
import {
  ANALYTICS_MAX_BATCH_EVENTS,
  ANALYTICS_MAX_OFFSET_MS,
  ANALYTICS_PLACEMENTS,
  ANALYTICS_ROUTES,
  ANALYTICS_SUMMARY_DAY_OPTIONS,
  VISITOR_ID_PATTERN,
} from '../../constants';
import type { AnalyticsEventName } from '../../types';

const offsetMsSchema = z.number().int().min(0).max(ANALYTICS_MAX_OFFSET_MS);

const eventsWithoutProperties: Exclude<AnalyticsEventName, 'page_view' | 'outbound_click'>[] = [
  'board_started',
  'board_restored',
  'first_mark',
  'bingo',
  'score_submitted',
  'play_again',
];

const propertylessEventSchemas = eventsWithoutProperties.map((name) =>
  z.object({ name: z.literal(name), offsetMs: offsetMsSchema }).strict(),
);

const eventSchema = z.discriminatedUnion('name', [
  z
    .object({
      name: z.literal('page_view'),
      offsetMs: offsetMsSchema,
      properties: z.object({ route: z.enum(ANALYTICS_ROUTES) }).strict(),
    })
    .strict(),
  z
    .object({
      name: z.literal('outbound_click'),
      offsetMs: offsetMsSchema,
      properties: z.object({ placement: z.enum(ANALYTICS_PLACEMENTS) }).strict(),
    })
    .strict(),
  ...propertylessEventSchemas,
]);

/** Body of POST /api/analytics/events: strict, fixed catalogue, 1 to 20 events, UUID v4 visitor ID. */
export const eventBatchSchema = z
  .object({
    visitorId: z.string().regex(VISITOR_ID_PATTERN, 'Visitor ID must be a lowercase UUID v4'),
    events: z.array(eventSchema).min(1).max(ANALYTICS_MAX_BATCH_EVENTS),
  })
  .strict();

/** Query of GET /api/admin/analytics: `days` must be one of the supported ranges. */
export const analyticsSummaryQuerySchema = z.object({
  days: z
    .string()
    .refine((value) => ANALYTICS_SUMMARY_DAY_OPTIONS.map(String).includes(value), `days must be one of ${ANALYTICS_SUMMARY_DAY_OPTIONS.join(', ')}`)
    .transform(Number),
});
