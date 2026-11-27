import type { ReactElement } from 'react';
import type { DailyAnalytics } from '../../../types';
import { EVENT_LABELS, EVENT_ORDER, formatCount, formatDay } from '../statsFormat';
import { Panel, PanelNote, PanelTitle } from '../statsPanel';
import { Table, TableScroller } from './DailyTable.styles';

interface DailyTableProps {
  days: DailyAnalytics[];
}

/** One row per Pacific Time day: that day's unique visitors, then a column per event. */
const DailyTable = ({ days }: DailyTableProps): ReactElement => (
  <Panel aria-labelledby="daily-title">
    <PanelTitle id="daily-title">By day</PanelTitle>
    <PanelNote>Times in Pacific Time.</PanelNote>
    <TableScroller>
      <Table>
        <caption>Visitors and events by day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Visitors</th>
            {EVENT_ORDER.map((eventName) => (
              <th key={eventName} scope="col">
                {EVENT_LABELS[eventName]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.day}>
              <th scope="row">{formatDay(day.day)}</th>
              <td>{formatCount(day.funnel.visited)}</td>
              {EVENT_ORDER.map((eventName) => (
                <td key={eventName}>{formatCount(day.events[eventName])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableScroller>
  </Panel>
);
DailyTable.displayName = 'DailyTable';

export default DailyTable;
