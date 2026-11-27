import type { ReactElement } from 'react';
import type { FunnelStep } from '../../../types';
import { formatCount, getPercent } from '../statsFormat';
import { Panel, PanelNote, PanelTitle } from '../statsPanel';
import { BarFill, BarTrack, Step, StepFigures, StepHeader, StepList, StepName } from './FunnelChart.styles';

/** Funnel steps in order with their display names. */
const FUNNEL_STEPS: ReadonlyArray<{ step: FunnelStep; label: string }> = [
  { step: 'visited', label: 'Visited' },
  { step: 'played', label: 'Played' },
  { step: 'marked', label: 'Marked a square' },
  { step: 'won', label: 'Got bingo' },
  { step: 'submitted', label: 'Submitted score' },
];

interface FunnelChartProps {
  funnel: Record<FunnelStep, number>;
  /** True when the range spans several days, so each count is visitors per day, summed. */
  isMultiDay: boolean;
}

/** Horizontal bars for each funnel step, labelled with the count and its share of visitors. */
const FunnelChart = ({ funnel, isMultiDay }: FunnelChartProps): ReactElement => (
  <Panel aria-labelledby="funnel-title">
    <PanelTitle id="funnel-title">Funnel</PanelTitle>
    {isMultiDay && <PanelNote>Daily visitors: someone active on three days counts three times.</PanelNote>}
    <StepList>
      {FUNNEL_STEPS.map(({ step, label }) => {
        const percent = getPercent(funnel[step], funnel.visited);
        return (
          <Step key={step}>
            <StepHeader>
              <StepName>{label}</StepName>
              <StepFigures>
                {formatCount(funnel[step])} · {percent}%
              </StepFigures>
            </StepHeader>
            <BarTrack aria-hidden="true">
              <BarFill $percent={percent} />
            </BarTrack>
          </Step>
        );
      })}
    </StepList>
  </Panel>
);
FunnelChart.displayName = 'FunnelChart';

export default FunnelChart;
