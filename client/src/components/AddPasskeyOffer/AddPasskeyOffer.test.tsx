import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import AddPasskeyOffer from './AddPasskeyOffer';

const createProps = () => ({
  onAdd: vi.fn().mockResolvedValue(undefined),
  onDismiss: vi.fn(),
  isBusy: false,
  error: null,
});

describe('AddPasskeyOffer', () => {
  it('adds a passkey with the trimmed name', async () => {
    const props = createProps();
    renderWithProviders(<AddPasskeyOffer {...props} />);

    await userEvent.type(screen.getByLabelText('Passkey name (optional)'), ' Laptop ');
    await userEvent.click(screen.getByRole('button', { name: 'Add passkey' }));

    expect(props.onAdd).toHaveBeenCalledWith('Laptop');
  });

  it('adds a passkey without a name when the field is blank', async () => {
    const props = createProps();
    renderWithProviders(<AddPasskeyOffer {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add passkey' }));

    expect(props.onAdd).toHaveBeenCalledWith(undefined);
  });

  it('dismisses with Not now', async () => {
    const props = createProps();
    renderWithProviders(<AddPasskeyOffer {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));

    expect(props.onDismiss).toHaveBeenCalled();
    expect(props.onAdd).not.toHaveBeenCalled();
  });

  it('disables the buttons while busy', () => {
    renderWithProviders(<AddPasskeyOffer {...createProps()} isBusy />);

    expect(screen.getByRole('button', { name: 'Add passkey' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeDisabled();
  });

  it('renders as a modal dialog named by its title', () => {
    renderWithProviders(<AddPasskeyOffer {...createProps()} />);

    const dialog = screen.getByRole('dialog', { name: 'Add a passkey for this device' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus into the dialog', () => {
    renderWithProviders(<AddPasskeyOffer {...createProps()} />);

    expect(screen.getByLabelText('Passkey name (optional)')).toHaveFocus();
  });

  it('dismisses with Escape', async () => {
    const props = createProps();
    renderWithProviders(<AddPasskeyOffer {...props} />);

    await userEvent.keyboard('{Escape}');

    expect(props.onDismiss).toHaveBeenCalled();
  });

  it('ignores Escape while busy', async () => {
    const props = createProps();
    renderWithProviders(<AddPasskeyOffer {...props} isBusy />);

    await userEvent.keyboard('{Escape}');

    expect(props.onDismiss).not.toHaveBeenCalled();
  });

  it('shows the add error inside the dialog', () => {
    renderWithProviders(<AddPasskeyOffer {...createProps()} error="Passkey prompt was dismissed." />);

    expect(screen.getByRole('dialog')).toContainElement(screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent('Passkey prompt was dismissed.');
  });
});
