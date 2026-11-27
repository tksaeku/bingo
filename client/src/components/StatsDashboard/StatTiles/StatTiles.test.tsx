import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAnalyticsSummary } from '../../../test/factories';
import { renderWithProviders } from '../../../test/renderWithProviders';
import StatTiles from './StatTiles';

describe('StatTiles', () => {
  it('shows the four headline numbers', () => {
    const base = createAnalyticsSummary();
    const summary = createAnalyticsSummary({
      uniqueVisitors: 1412,
      totals: {
        ...base.totals,
        events: { ...base.totals.events, board_started: 640, bingo: 301, score_submitted: 244 },
      },
    });
    renderWithProviders(<StatTiles summary={summary} />);

    expect(screen.getByText('Unique visitors').nextSibling).toHaveTextContent('1,412');
    expect(screen.getByText('Boards started').nextSibling).toHaveTextContent('640');
    expect(screen.getByText('Bingos').nextSibling).toHaveTextContent('301');
    expect(screen.getByText('Scores submitted').nextSibling).toHaveTextContent('244');
  });

  it('renders zeros cleanly', () => {
    renderWithProviders(<StatTiles summary={createAnalyticsSummary()} />);

    expect(screen.getByText('Bingos').nextSibling).toHaveTextContent('0');
  });
});
