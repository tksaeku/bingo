import { ANALYTICS_TIME_ZONE } from '../../constants';

const MILLISECONDS_PER_DAY = 86_400_000;

const dayPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ANALYTICS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hourCycle: 'h23',
  hour: '2-digit',
});

/** Reads one named part of the formatted date in the analytics time zone. */
function getPart(date: Date, type: 'year' | 'month' | 'day' | 'hour'): string {
  const part = dayPartsFormatter.formatToParts(date).find((candidate) => candidate.type === type);
  return part ? part.value : '';
}

/** Returns the analytics (America/Los_Angeles) calendar day of an instant as `YYYY-MM-DD`. */
export function getAnalyticsDay(date: Date): string {
  return `${getPart(date, 'year')}-${getPart(date, 'month')}-${getPart(date, 'day')}`;
}

/** Returns the analytics (America/Los_Angeles) hour of an instant, 0-23. */
export function getAnalyticsHour(date: Date): number {
  return Number(getPart(date, 'hour')) % 24;
}

/** Returns `count` consecutive `YYYY-MM-DD` days ending at `today`, oldest first. */
export function getRecentDays(today: string, count: number): string[] {
  const [year, month, day] = today.split('-').map(Number);
  const todayUtcMilliseconds = Date.UTC(year, month - 1, day);
  return Array.from({ length: count }, (_unused, index) =>
    new Date(todayUtcMilliseconds - (count - 1 - index) * MILLISECONDS_PER_DAY).toISOString().slice(0, 10),
  );
}
