import { screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createAxiosError } from '../../test/axiosErrors';
import { renderWithProviders } from '../../test/renderWithProviders';
import WinModal from './WinModal';

const createProps = () => ({
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
  onPlayAgain: vi.fn(),
});

describe('WinModal', () => {
  describe('dialog semantics', () => {
    it('is a labelled modal dialog with focus moved inside', () => {
      renderWithProviders(<WinModal {...createProps()} />);

      const dialog = screen.getByRole('dialog', { name: /bingo/i });
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      expect(screen.getByLabelText('Your name')).toBeInTheDocument();
    });

    it('closes on Escape', async () => {
      const props = createProps();
      renderWithProviders(<WinModal {...props} />);

      await userEvent.keyboard('{Escape}');
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('keeps Tab and Shift+Tab focus inside the dialog, never on outside elements', async () => {
      renderWithProviders(
        <>
          <button type="button">Outside before</button>
          <WinModal {...createProps()} />
          <button type="button">Outside after</button>
        </>,
      );
      const dialog = screen.getByRole('dialog');
      await userEvent.type(screen.getByLabelText('Your name'), 'Bob');

      for (let press = 0; press < 8; press += 1) {
        await userEvent.tab();
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
      }
      for (let press = 0; press < 8; press += 1) {
        await userEvent.tab({ shift: true });
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
      }
    });

    it('returns focus to the trigger when the dialog unmounts', async () => {
      const Host = (): ReactElement => {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setIsOpen(true)}>
              Open
            </button>
            {isOpen && <WinModal {...createProps()} onClose={() => setIsOpen(false)} />}
          </>
        );
      };
      renderWithProviders(<Host />);

      const trigger = screen.getByRole('button', { name: 'Open' });
      await userEvent.click(trigger);
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);

      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  describe('submitting', () => {
    it('disables submit until the name is valid', async () => {
      renderWithProviders(<WinModal {...createProps()} />);
      const submit = screen.getByRole('button', { name: 'Submit Score' });

      expect(submit).toBeDisabled();
      await userEvent.type(screen.getByLabelText('Your name'), '   ');
      expect(submit).toBeDisabled();
      await userEvent.type(screen.getByLabelText('Your name'), 'Al');
      expect(submit).toBeEnabled();
    });

    it('submits the trimmed, whitespace-collapsed name and confirms', async () => {
      const props = createProps();
      renderWithProviders(<WinModal {...props} />);

      await userEvent.type(screen.getByLabelText('Your name'), '  Bob   Ross ');
      await userEvent.click(screen.getByRole('button', { name: 'Submit Score' }));

      expect(props.onSubmit).toHaveBeenCalledWith('Bob Ross');
      expect(await screen.findByRole('status')).toHaveTextContent('Score submitted! Good luck, Bob Ross!');
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it('shows a pending state and blocks double submit', async () => {
      const props = createProps();
      let resolveSubmit: () => void = () => undefined;
      props.onSubmit.mockImplementation(() => new Promise<void>((resolve) => (resolveSubmit = resolve)));
      renderWithProviders(<WinModal {...props} />);

      await userEvent.type(screen.getByLabelText('Your name'), 'Bob{Enter}');
      expect(await screen.findByRole('button', { name: 'Submitting...' })).toBeDisabled();
      await userEvent.type(screen.getByLabelText('Your name'), '{Enter}');
      expect(props.onSubmit).toHaveBeenCalledTimes(1);

      resolveSubmit();
      expect(await screen.findByRole('button', { name: 'Play Again' })).toBeInTheDocument();
    });

    it('shows the error, stays open, and allows retry', async () => {
      const props = createProps();
      props.onSubmit.mockRejectedValueOnce(createAxiosError(429, 'Too many requests'));
      renderWithProviders(<WinModal {...props} />);

      await userEvent.type(screen.getByLabelText('Your name'), 'Bob');
      await userEvent.click(screen.getByRole('button', { name: 'Submit Score' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(props.onClose).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      await waitFor(() => expect(props.onSubmit).toHaveBeenCalledTimes(2));
      expect(await screen.findByRole('button', { name: 'Play Again' })).toBeInTheDocument();
    });
  });

  describe('after success', () => {
    it('calls onPlayAgain from Play Again', async () => {
      const props = createProps();
      renderWithProviders(<WinModal {...props} />);

      await userEvent.type(screen.getByLabelText('Your name'), 'Bob{Enter}');
      await userEvent.click(await screen.findByRole('button', { name: 'Play Again' }));
      expect(props.onPlayAgain).toHaveBeenCalledTimes(1);
    });
  });
});
