import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getSupportsPasskeys } from '../../services/passkeyCeremony';
import { renderWithProviders } from '../../test/renderWithProviders';
import AdminUnlock from './AdminUnlock';

vi.mock('../../services/passkeyCeremony', () => ({ getSupportsPasskeys: vi.fn(() => true) }));

const createProps = () => ({
  onUnlockWithPasskey: vi.fn().mockResolvedValue(undefined),
  onUnlockWithKey: vi.fn().mockResolvedValue(true),
  isBusy: false,
  errorMessage: null as string | null,
  description: 'Unlock to test.',
});

describe('AdminUnlock', () => {
  it('shows the description it is given', () => {
    renderWithProviders(<AdminUnlock {...createProps()} description="Unlock to view the usage stats." />);
    expect(screen.getByText('Unlock to view the usage stats.')).toBeInTheDocument();
  });

  describe('with passkey support', () => {
    it('offers the passkey button and keeps the key form collapsed', () => {
      renderWithProviders(<AdminUnlock {...createProps()} />);

      expect(screen.getByRole('button', { name: 'Unlock with passkey' })).toBeInTheDocument();
      expect(screen.getByText('Use the admin key').closest('details')).not.toHaveAttribute('open');
    });

    it('starts the passkey sign-in only on click', async () => {
      const props = createProps();
      renderWithProviders(<AdminUnlock {...props} />);
      expect(props.onUnlockWithPasskey).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Unlock with passkey' }));

      expect(props.onUnlockWithPasskey).toHaveBeenCalledTimes(1);
    });
  });

  describe('without passkey support', () => {
    it('hides the passkey button and opens the key form', () => {
      vi.mocked(getSupportsPasskeys).mockReturnValueOnce(false);
      renderWithProviders(<AdminUnlock {...createProps()} />);

      expect(screen.queryByRole('button', { name: 'Unlock with passkey' })).not.toBeInTheDocument();
      expect(screen.getByText('Use the admin key').closest('details')).toHaveAttribute('open');
    });
  });

  describe('admin key form', () => {
    it('has a labelled password field', () => {
      renderWithProviders(<AdminUnlock {...createProps()} />);
      expect(screen.getByLabelText('Admin key')).toHaveAttribute('type', 'password');
    });

    it('submits the entered key and clears the input', async () => {
      const props = createProps();
      renderWithProviders(<AdminUnlock {...props} />);

      await userEvent.type(screen.getByLabelText('Admin key'), 'hunter2{Enter}');

      expect(props.onUnlockWithKey).toHaveBeenCalledWith('hunter2');
      expect(screen.getByLabelText('Admin key')).toHaveValue('');
    });

    it('clears the input even when the key is rejected', async () => {
      const props = createProps();
      props.onUnlockWithKey.mockResolvedValue(false);
      renderWithProviders(<AdminUnlock {...props} />);

      await userEvent.type(screen.getByLabelText('Admin key'), 'bad{Enter}');

      expect(screen.getByLabelText('Admin key')).toHaveValue('');
    });
  });

  it('shows the error message as an alert', () => {
    renderWithProviders(<AdminUnlock {...createProps()} errorMessage="Passkey prompt was dismissed." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Passkey prompt was dismissed.');
  });

  it('disables both actions while busy', () => {
    renderWithProviders(<AdminUnlock {...createProps()} isBusy />);

    expect(screen.getByRole('button', { name: 'Unlock with passkey' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });
});
