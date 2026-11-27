import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import FunnelChart from './FunnelChart';

const FUNNEL = { visited: 200, played: 150, marked: 100, won: 50, submitted: 25 };

describe('FunnelChart', () => {
  it('labels each step with its count and percentage of visitors', () => {
    renderWithProviders(<FunnelChart funnel={FUNNEL} isMultiDay={false} />);
    const steps = screen.getAllByRole('listitem');

    expect(steps).toHaveLength(5);
    expect(within(steps[0]).getByText('200 · 100%')).toBeInTheDocument();
    expect(within(steps[1]).getByText('150 · 75%')).toBeInTheDocument();
    expect(within(steps[4]).getByText('25 · 13%')).toBeInTheDocument();
  });

  it('labels multi-day counts as daily visitors', () => {
    renderWithProviders(<FunnelChart funnel={FUNNEL} isMultiDay />);
    expect(screen.getByText(/Daily visitors/)).toBeInTheDocument();
  });

  it('has no daily-visitors note for a single day', () => {
    renderWithProviders(<FunnelChart funnel={FUNNEL} isMultiDay={false} />);

    expect(screen.queryByText(/Daily visitors/)).not.toBeInTheDocument();
  });

  it('shows 0% everywhere when nobody visited', () => {
    renderWithProviders(
      <FunnelChart funnel={{ visited: 0, played: 0, marked: 0, won: 0, submitted: 0 }} isMultiDay={false} />,
    );

    expect(screen.getAllByText('0 · 0%')).toHaveLength(5);
  });
});
