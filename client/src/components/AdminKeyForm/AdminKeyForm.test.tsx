import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import AdminKeyForm from './AdminKeyForm';

const createProps = () => ({
  onVerify: vi.fn().mockResolvedValue(true),
  isVerifying: false,
  errorMessage: null as string | null,
  description: 'Enter the admin key to test.',
});

describe('AdminKeyForm', () => {
  it('has a labelled password field', () => {
    renderWithProviders(<AdminKeyForm {...createProps()} />);
    expect(screen.getByLabelText('Admin key')).toHaveAttribute('type', 'password');
  });

  it('shows the description it is given', () => {
    renderWithProviders(<AdminKeyForm {...createProps()} description="Enter the admin key to view the usage stats." />);
    expect(screen.getByText('Enter the admin key to view the usage stats.')).toBeInTheDocument();
  });

  it('submits the entered key', async () => {
    const props = createProps();
    renderWithProviders(<AdminKeyForm {...props} />);

    await userEvent.type(screen.getByLabelText('Admin key'), 'hunter2{Enter}');
    expect(props.onVerify).toHaveBeenCalledWith('hunter2');
  });

  it('shows the error message', () => {
    renderWithProviders(<AdminKeyForm {...createProps()} errorMessage="That admin key was not accepted." />);
    expect(screen.getByRole('alert')).toHaveTextContent('That admin key was not accepted.');
  });

  it('disables the button while verifying', () => {
    renderWithProviders(<AdminKeyForm {...createProps()} isVerifying />);
    expect(screen.getByRole('button', { name: 'Verifying...' })).toBeDisabled();
  });
});
