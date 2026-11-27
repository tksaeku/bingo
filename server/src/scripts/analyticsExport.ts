import type { AnalyticsBatchRecord, StoredAnalyticsEvent } from '../types';

export type ExportArguments = {
  fromDay: string;
  toDay: string;
  outputPath: string;
  isConfirmed: boolean;
};

/** One exported line: the batch's fields flattened onto a single event. */
export type FlattenedEvent = {
  visitorId: string;
  day: string;
  receivedAt: string;
  deviceType: AnalyticsBatchRecord['deviceType'];
  name: StoredAnalyticsEvent['name'];
  properties?: StoredAnalyticsEvent['properties'];
  occurredAt: string;
};

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar day written as `YYYY-MM-DD`. */
function getIsValidDay(value: string | undefined): value is string {
  if (value === undefined || !DAY_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

/** Reads the value following `--flag`, or undefined when absent or followed by another flag. */
function readFlagValue(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  const value = index === -1 ? undefined : argv[index + 1];
  return value === undefined || value.startsWith('--') ? undefined : value;
}

/** Parses `--from`, `--to`, `--out` and `--yes`; throws a readable error for missing or invalid input. */
export function parseExportArguments(argv: readonly string[]): ExportArguments {
  const fromDay = readFlagValue(argv, '--from');
  const toDay = readFlagValue(argv, '--to');
  if (!getIsValidDay(fromDay) || !getIsValidDay(toDay)) {
    throw new Error('--from and --to are required and must be valid YYYY-MM-DD days');
  }
  if (fromDay > toDay) {
    throw new Error('--from must not be after --to');
  }
  return {
    fromDay,
    toDay,
    outputPath: readFlagValue(argv, '--out') ?? `analytics-${fromDay}_${toDay}.jsonl`,
    isConfirmed: argv.includes('--yes'),
  };
}

/** The export is read-only, but like `seed` it refuses a real project unless `--yes` is passed. */
export function getIsExportAllowed(isEmulator: boolean, isConfirmed: boolean): boolean {
  return isEmulator || isConfirmed;
}

/** Flattens batches into one record per event, ordered by when each event happened. */
export function flattenBatches(batches: readonly AnalyticsBatchRecord[]): FlattenedEvent[] {
  return batches
    .flatMap((batch) =>
      batch.events.map(
        (event): FlattenedEvent => ({
          visitorId: batch.visitorId,
          day: batch.day,
          receivedAt: batch.receivedAt,
          deviceType: batch.deviceType,
          name: event.name,
          ...(event.properties ? { properties: event.properties } : {}),
          occurredAt: event.occurredAt,
        }),
      ),
    )
    .sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));
}

/** Serializes events as JSON lines, one per event, with a trailing newline when non-empty. */
export function toJsonLines(events: readonly FlattenedEvent[]): string {
  return events.map((event) => `${JSON.stringify(event)}\n`).join('');
}
