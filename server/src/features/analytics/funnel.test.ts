import { describe, expect, it } from 'vitest';
import { getFunnelStepsForEvents } from './funnel';

describe('getFunnelStepsForEvents', () => {
  it('returns nothing for no events', () => {
    expect(getFunnelStepsForEvents([])).toEqual([]);
  });

  it('maps a plain page_view to visited only', () => {
    expect(getFunnelStepsForEvents([{ name: 'page_view' }, { name: 'play_again' }, { name: 'outbound_click' }])).toEqual(['visited']);
  });

  it('maps each step-reaching event', () => {
    expect(getFunnelStepsForEvents([{ name: 'board_started' }])).toEqual(['visited', 'played']);
    expect(getFunnelStepsForEvents([{ name: 'board_restored' }])).toEqual(['visited', 'played']);
    expect(getFunnelStepsForEvents([{ name: 'first_mark' }])).toEqual(['visited', 'marked']);
    expect(getFunnelStepsForEvents([{ name: 'bingo' }])).toEqual(['visited', 'won']);
    expect(getFunnelStepsForEvents([{ name: 'score_submitted' }])).toEqual(['visited', 'submitted']);
  });

  it('returns distinct steps for a mixed batch', () => {
    const steps = getFunnelStepsForEvents([{ name: 'board_started' }, { name: 'board_restored' }, { name: 'first_mark' }, { name: 'bingo' }]);
    expect(steps).toEqual(['visited', 'played', 'marked', 'won']);
  });
});
