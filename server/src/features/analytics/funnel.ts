import type { AnalyticsEventName, FunnelStep } from '../../types';

const FUNNEL_STEP_BY_EVENT: Partial<Record<AnalyticsEventName, FunnelStep>> = {
  board_started: 'played',
  board_restored: 'played',
  first_mark: 'marked',
  bingo: 'won',
  score_submitted: 'submitted',
};

/** Returns the distinct funnel steps a set of events reaches; any event reaches `visited`. */
export function getFunnelStepsForEvents(events: readonly { name: AnalyticsEventName }[]): FunnelStep[] {
  if (events.length === 0) {
    return [];
  }
  const steps = new Set<FunnelStep>(['visited']);
  events.forEach((event) => {
    const step = FUNNEL_STEP_BY_EVENT[event.name];
    if (step !== undefined) {
      steps.add(step);
    }
  });
  return [...steps];
}
