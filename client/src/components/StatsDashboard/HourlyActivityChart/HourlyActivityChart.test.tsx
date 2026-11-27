import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import HourlyActivityChart from './HourlyActivityChart';

describe('HourlyActivityChart', () => {
  it('summarizes the busiest hour and provides a table of all 24 hours', () => {
    const hourly = Array.from({ length: 24 }, (_, hour) => (hour === 15 ? 120 : 1));
    renderWithProviders(<HourlyActivityChart hourly={hourly} />);

    expect(screen.getByText('Busiest hour: 3 PM with 120 events.')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Events by hour, Pacific Time' });
    expect(within(table).getAllByRole('row')).toHaveLength(25);
    expect(within(table).getByRole('row', { name: '3 PM 120' })).toBeInTheDocument();
  });

  it('says so when there is no activity', () => {
    renderWithProviders(<HourlyActivityChart hourly={Array.from({ length: 24 }, () => 0)} />);

    expect(screen.getByText('No activity in this range yet.')).toBeInTheDocument();
  });
});
