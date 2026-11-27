import { useState } from 'react';
import type { ReactElement } from 'react';
import { useAnalyticsSummary } from '../../../hooks/useAnalyticsSummary';
import { Button } from '../../../styles/Button';
import { CardLoading } from '../../../styles/Card';
import { ErrorMessage } from '../../../styles/Form';
import type { AnalyticsRangeDays, AnalyticsSummary } from '../../../types';
import BreakdownList from '../BreakdownList/BreakdownList';
import DailyTable from '../DailyTable/DailyTable';
import FunnelChart from '../FunnelChart/FunnelChart';
import HourlyActivityChart from '../HourlyActivityChart/HourlyActivityChart';
import StatTiles from '../StatTiles/StatTiles';
import { DEVICE_LABELS, PLACEMENT_LABELS, ROUTE_LABELS, formatClockTime } from '../statsFormat';
import {
  DashboardCard,
  FreshnessNote,
  RangeButton,
  RangeGroup,
  ThreeColumnGrid,
  Toolbar,
  TwoColumnGrid,
} from './StatsDashboard.styles';

/** Range presets, in display order. */
const RANGE_PRESETS: ReadonlyArray<{ days: AnalyticsRangeDays; label: string }> = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
];

/** Range selected on first load. */
const DEFAULT_RANGE_DAYS: AnalyticsRangeDays = 7;

interface StatsDashboardProps {
  adminKey: string;
  /** Called when the server rejects the admin key (HTTP 401). */
  onUnauthorized: () => void;
}

interface SummarySectionsProps {
  summary: AnalyticsSummary;
}

/** Every dashboard section for one summary. */
const SummarySections = ({ summary }: SummarySectionsProps): ReactElement => {
  const { totals } = summary;
  return (
    <>
      <StatTiles summary={summary} />
      <TwoColumnGrid>
        <FunnelChart funnel={totals.funnel} isMultiDay={summary.days.length > 1} />
        <HourlyActivityChart hourly={totals.hourly} />
      </TwoColumnGrid>
      <DailyTable days={summary.days} />
      <ThreeColumnGrid>
        <BreakdownList
          title="Page views"
          items={(Object.keys(ROUTE_LABELS) as Array<keyof typeof ROUTE_LABELS>).map((route) => ({
            label: ROUTE_LABELS[route],
            count: totals.pageViews[route],
          }))}
        />
        <BreakdownList
          title="Outbound clicks"
          items={(Object.keys(PLACEMENT_LABELS) as Array<keyof typeof PLACEMENT_LABELS>).map((placement) => ({
            label: PLACEMENT_LABELS[placement],
            count: totals.outboundClicks[placement],
          }))}
        />
        <BreakdownList
          title="Devices"
          note="Daily visitors by device."
          items={(Object.keys(DEVICE_LABELS) as Array<keyof typeof DEVICE_LABELS>).map((device) => ({
            label: DEVICE_LABELS[device],
            count: totals.devices[device],
          }))}
        />
      </ThreeColumnGrid>
    </>
  );
};
SummarySections.displayName = 'SummarySections';

/**
 * Analytics dashboard for the selected range. Only the first load shows a loading state; refreshes and range
 * changes keep the previous numbers on screen, and a failed fetch shows an error rather than zeros.
 */
const StatsDashboard = ({ adminKey, onUnauthorized }: StatsDashboardProps): ReactElement => {
  const [days, setDays] = useState<AnalyticsRangeDays>(DEFAULT_RANGE_DAYS);
  const { data: summary, loading, error, refetch } = useAnalyticsSummary(adminKey, days, onUnauthorized);

  if (loading) {
    return (
      <DashboardCard aria-label="Stats">
        <CardLoading role="status" aria-live="polite">
          Loading stats...
        </CardLoading>
      </DashboardCard>
    );
  }

  const isShowingOtherRange = summary !== null && summary.days.length !== days;

  return (
    <DashboardCard aria-label="Stats" aria-busy={isShowingOtherRange}>
      <Toolbar>
        <RangeGroup role="group" aria-label="Date range">
          {RANGE_PRESETS.map((preset) => (
            <RangeButton
              key={preset.days}
              type="button"
              aria-pressed={preset.days === days}
              onClick={() => setDays(preset.days)}
            >
              {preset.label}
            </RangeButton>
          ))}
        </RangeGroup>
        <Button type="button" $variant="secondary" $size="small" onClick={refetch}>
          Refresh
        </Button>
        <FreshnessNote>
          {summary === null
            ? 'Times in Pacific Time.'
            : `${isShowingOtherRange ? 'Updating... ' : ''}Last updated ${formatClockTime(summary.generatedAt, summary.timeZone)}. Times in Pacific Time.`}
        </FreshnessNote>
      </Toolbar>

      {error !== null && (
        <ErrorMessage role="alert">
          {summary === null ? error : `Couldn't refresh: ${error} Showing the last numbers loaded.`}
        </ErrorMessage>
      )}

      {summary !== null && <SummarySections summary={summary} />}
    </DashboardCard>
  );
};
StatsDashboard.displayName = 'StatsDashboard';

export default StatsDashboard;
