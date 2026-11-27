import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import BreakdownList from './BreakdownList';

describe('BreakdownList', () => {
  it('lists each label with its count', () => {
    renderWithProviders(
      <BreakdownList
        title="Devices"
        note="Daily visitors by device."
        items={[
          { label: 'Mobile', count: 1470 },
          { label: 'Tablet', count: 0 },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');

    expect(screen.getByRole('heading', { name: 'Devices' })).toBeInTheDocument();
    expect(screen.getByText('Daily visitors by device.')).toBeInTheDocument();
    expect(within(items[0]).getByText('1,470')).toBeInTheDocument();
    expect(within(items[1]).getByText('0')).toBeInTheDocument();
  });
});
