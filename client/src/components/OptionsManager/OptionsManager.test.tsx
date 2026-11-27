import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { optionsApi } from '../../services/api';
import { createAxiosError } from '../../test/axiosErrors';
import { createOptions } from '../../test/factories';
import { renderWithProviders } from '../../test/renderWithProviders';
import OptionsManager from './OptionsManager';

vi.mock('../../services/api', () => ({
  optionsApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
  leaderboardApi: { getAll: vi.fn(), submitWin: vi.fn() },
  adminApi: { verify: vi.fn() },
}));

const createProps = () => ({ adminKey: 'secret', onUnauthorized: vi.fn() });

describe('OptionsManager', () => {
  describe('loading the list', () => {
    it('shows loading, then the options with a count', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(3));
      renderWithProviders(<OptionsManager {...createProps()} />);

      expect(screen.getByRole('status')).toHaveTextContent('Loading cards...');
      expect(await screen.findByText('Option 0')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Current Cards (3)' })).toBeInTheDocument();
    });

    it('shows the empty state', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue([]);
      renderWithProviders(<OptionsManager {...createProps()} />);

      expect(await screen.findByText(/No cards yet/)).toBeInTheDocument();
    });

    it('warns when the deck is too small to fill a board', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(20));
      renderWithProviders(<OptionsManager {...createProps()} />);

      expect(await screen.findByText('Not enough cards to play')).toBeInTheDocument();
      expect(screen.getByText(/Add 4 more/)).toBeInTheDocument();
    });

    it('hides the warning once the deck can fill a board', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(24));
      renderWithProviders(<OptionsManager {...createProps()} />);

      await screen.findByText('Option 0');
      expect(screen.queryByText('Not enough cards to play')).not.toBeInTheDocument();
    });

    it('shows an error when loading fails', async () => {
      vi.mocked(optionsApi.getAll).mockRejectedValue(createAxiosError(500, 'Load broke'));
      renderWithProviders(<OptionsManager {...createProps()} />);

      expect(await screen.findByRole('alert')).toHaveTextContent('Load broke');
    });

    it('offers Retry when the initial load fails', async () => {
      vi.mocked(optionsApi.getAll)
        .mockRejectedValueOnce(createAxiosError(500, 'Load broke'))
        .mockResolvedValueOnce(createOptions(2));
      renderWithProviders(<OptionsManager {...createProps()} />);

      await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('Option 0')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });
  });

  describe('adding an option', () => {
    it('sends the trimmed text with the admin key, clears the input, and keeps the list visible', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(2));
      vi.mocked(optionsApi.create).mockResolvedValue(createOptions(1)[0]);
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText('Option 0');

      const input = screen.getByLabelText('New card');
      await userEvent.type(input, '  Fresh idea  ');
      await userEvent.click(screen.getByRole('button', { name: 'Add Card' }));

      expect(optionsApi.create).toHaveBeenCalledWith('Fresh idea', 'secret');
      await waitFor(() => expect(input).toHaveValue(''));
      expect(input).toHaveFocus();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Option 0')).toBeInTheDocument();
      expect(optionsApi.getAll).toHaveBeenCalledTimes(2);
    });

    it('keeps Add disabled for blank text', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue([]);
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText(/No cards yet/);

      await userEvent.type(screen.getByLabelText('New card'), '   ');
      expect(screen.getByRole('button', { name: 'Add Card' })).toBeDisabled();
    });

    it('shows a duplicate message on 409 and keeps the typed text', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.create).mockRejectedValue(createAxiosError(409, 'Duplicate'));
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText('Option 0');

      await userEvent.type(screen.getByLabelText('New card'), 'option 0');
      await userEvent.click(screen.getByRole('button', { name: 'Add Card' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('That card already exists.');
      expect(screen.getByLabelText('New card')).toHaveValue('option 0');
      expect(screen.getByText('Option 0')).toBeInTheDocument();
    });

    it('shows the server message for other add failures', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.create).mockRejectedValue(createAxiosError(400, 'Invalid request body'));
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText('Option 0');

      await userEvent.type(screen.getByLabelText('New card'), 'More');
      await userEvent.click(screen.getByRole('button', { name: 'Add Card' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Invalid request body');
    });

    it('disables Add while the request is in flight', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.create).mockReturnValue(new Promise(() => undefined));
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText('Option 0');

      await userEvent.type(screen.getByLabelText('New card'), 'Slow');
      await userEvent.click(screen.getByRole('button', { name: 'Add Card' }));

      expect(screen.getByRole('button', { name: 'Add Card' })).toBeDisabled();
      expect(optionsApi.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleting an option', () => {
    it('asks for in-page confirmation before deleting', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(2));
      vi.mocked(optionsApi.delete).mockResolvedValue(undefined);
      const confirmSpy = vi.spyOn(window, 'confirm');
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText('Option 0');

      await userEvent.click(screen.getByRole('button', { name: 'Delete Option 0' }));
      expect(optionsApi.delete).not.toHaveBeenCalled();
      expect(screen.getByText('Delete this card?')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
      expect(optionsApi.delete).toHaveBeenCalledWith('option-0', 'secret');
      await waitFor(() => expect(screen.queryByText('Delete this card?')).not.toBeInTheDocument());
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(screen.getByLabelText('New card')).toHaveFocus();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('cancels without deleting', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText('Option 0');

      await userEvent.click(screen.getByRole('button', { name: 'Delete Option 0' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(optionsApi.delete).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Delete Option 0' })).toBeInTheDocument();
    });

    it('shows an error and keeps the row when deletion fails', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.delete).mockRejectedValue(createAxiosError(404, 'Option not found'));
      renderWithProviders(<OptionsManager {...createProps()} />);
      await screen.findByText('Option 0');

      await userEvent.click(screen.getByRole('button', { name: 'Delete Option 0' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Option not found');
      expect(within(screen.getByRole('list')).getByText('Option 0')).toBeInTheDocument();
    });
  });

  describe('when the server rejects the key', () => {
    it('calls onUnauthorized on a 401 add', async () => {
      const props = createProps();
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.create).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<OptionsManager {...props} />);
      await screen.findByText('Option 0');

      await userEvent.type(screen.getByLabelText('New card'), 'Thing');
      await userEvent.click(screen.getByRole('button', { name: 'Add Card' }));

      await waitFor(() => expect(props.onUnauthorized).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('calls onUnauthorized on a 401 delete', async () => {
      const props = createProps();
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.delete).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<OptionsManager {...props} />);
      await screen.findByText('Option 0');

      await userEvent.click(screen.getByRole('button', { name: 'Delete Option 0' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

      await waitFor(() => expect(props.onUnauthorized).toHaveBeenCalledTimes(1));
    });
  });
});
