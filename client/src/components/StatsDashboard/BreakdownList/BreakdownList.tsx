import { useId } from 'react';
import type { ReactElement } from 'react';
import { formatCount, getPercent } from '../statsFormat';
import { Panel, PanelNote, PanelTitle } from '../statsPanel';
import { BarFill, BarTrack, Item, ItemHeader, Items } from './BreakdownList.styles';

interface BreakdownItem {
  label: string;
  count: number;
}

interface BreakdownListProps {
  title: string;
  note?: string;
  items: BreakdownItem[];
}

/** Labelled counts with bars sized relative to the largest count. */
const BreakdownList = ({ title, note, items }: BreakdownListProps): ReactElement => {
  const titleId = useId();
  const largestCount = Math.max(0, ...items.map((item) => item.count));

  return (
    <Panel aria-labelledby={titleId}>
      <PanelTitle id={titleId}>{title}</PanelTitle>
      {note !== undefined && <PanelNote>{note}</PanelNote>}
      <Items>
        {items.map((item) => (
          <Item key={item.label}>
            <ItemHeader>
              <span>{item.label}</span>
              <span>{formatCount(item.count)}</span>
            </ItemHeader>
            <BarTrack aria-hidden="true">
              <BarFill $percent={getPercent(item.count, largestCount)} />
            </BarTrack>
          </Item>
        ))}
      </Items>
    </Panel>
  );
};
BreakdownList.displayName = 'BreakdownList';

export default BreakdownList;
