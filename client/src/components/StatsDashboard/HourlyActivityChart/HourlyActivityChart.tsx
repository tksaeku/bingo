import type { ReactElement } from 'react';
import { formatCount, formatHour, getPercent } from '../statsFormat';
import { Panel, PanelNote, PanelTitle, VisuallyHidden } from '../statsPanel';
import { Bar, Bars, PeakSummary, Ticks } from './HourlyActivityChart.styles';

/** Hours labelled under the bars. */
const TICK_HOURS = [0, 6, 12, 18];

interface HourlyActivityChartProps {
  /** Events per Pacific Time hour, index 0-23. */
  hourly: number[];
}

/** 24 vertical bars of activity by Pacific Time hour, with the same numbers in a table for assistive technology. */
const HourlyActivityChart = ({ hourly }: HourlyActivityChartProps): ReactElement => {
  const peakCount = Math.max(0, ...hourly);
  const peakHour = hourly.indexOf(peakCount);

  return (
    <Panel aria-labelledby="hourly-title">
      <PanelTitle id="hourly-title">Activity by hour</PanelTitle>
      <PanelNote>All events, Pacific Time.</PanelNote>
      <Bars aria-hidden="true">
        {hourly.map((count, hour) => (
          <Bar key={hour} $percent={getPercent(count, peakCount)} title={`${formatHour(hour)}: ${count}`} />
        ))}
      </Bars>
      <Ticks aria-hidden="true">
        {TICK_HOURS.map((hour) => (
          <span key={hour}>{formatHour(hour)}</span>
        ))}
      </Ticks>
      <PeakSummary>
        {peakCount > 0
          ? `Busiest hour: ${formatHour(peakHour)} with ${formatCount(peakCount)} events.`
          : 'No activity in this range yet.'}
      </PeakSummary>
      <VisuallyHidden>
        <table>
          <caption>Events by hour, Pacific Time</caption>
          <thead>
            <tr>
              <th scope="col">Hour</th>
              <th scope="col">Events</th>
            </tr>
          </thead>
          <tbody>
            {hourly.map((count, hour) => (
              <tr key={hour}>
                <th scope="row">{formatHour(hour)}</th>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </Panel>
  );
};
HourlyActivityChart.displayName = 'HourlyActivityChart';

export default HourlyActivityChart;
