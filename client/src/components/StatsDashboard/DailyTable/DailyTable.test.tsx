import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createAnalyticsSummary } from '../../../test/factories';
import { renderWithProviders } from '../../../test/renderWithProviders';
import DailyTable from './DailyTable';

describe('DailyTable', () => {
  it('shows one row per day with visitors and each event', () => {
    const base = createAnalyticsSummary().days[0];
    const days = [
      {
        ...base,
        day: '2026-11-25',
        funnel: { ...base.funnel, visited: 40 },
        events: { ...base.events, bingo: 7 },
      },
      { ...base, day: '2026-11-26', funnel: { ...base.funnel, visited: 1200 } },
    ];
    renderWithProviders(<DailyTable days={days} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('Wed, Nov 25');
    expect(within(rows[1]).getAllByRole('cell')[0]).toHaveTextContent('40');
    expect(within(rows[2]).getAllByRole('cell')[0]).toHaveTextContent('1,200');
    expect(screen.getByRole('columnheader', { name: 'Bingos' })).toBeInTheDocument();
  });
});
