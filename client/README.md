# Bingo client

React 19 + TypeScript single-page app built with Vite 7. It renders the bingo board, the leaderboard and the admin option editor. The server owns validation, deduplication, win counting and authorization; the client mirrors those rules only for UX. Product behavior and the API contract are in `../.claude/docs/spec.md`.

## Scripts

Run from the repo root with `-w client`, or from `client/`:

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | `tsc -b` then `vite build` into `dist/` |
| `npm run preview` | Serve the built app locally |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | `eslint .` (zero warnings expected) |
| `npm test` | `vitest run` (jsdom + Testing Library) |

## Configuration

The client calls the same-origin `/api`: in dev the Vite server proxies it to the Express server on `:5174`, and in production the server serves the client. `VITE_API_URL` overrides the base URL and is normally unset.

## Structure

```
src/
  main.tsx            entry: StrictMode + BrowserRouter
  App.tsx             theme + global style, nav, routes
  types.ts            shared types
  constants.ts        board size, limits, storage keys, refresh interval
  theme.ts            design tokens (styled-components ThemeProvider)
  styles/             GlobalStyle and shared styled primitives (Button, Panel, inputs, messages)
  components/<Name>/  <Name>.tsx, <Name>.styles.ts, <Name>.test.tsx
  pages/              route-level components (OptionsPage)
  hooks/              data and behavior hooks
  game/               pure game logic (no React)
  services/           API client, error helpers, storage helpers
  test/               test setup, factories, render helper
```

### Components

- `BingoBoard` - the 5x5 board; cells are toggle buttons (`aria-pressed`).
- `WinModal` - accessible dialog (focus trap, Escape, labelled input) that submits the player name with pending, error and retry states, then offers Play Again.
- `Leaderboard` - top 20, refreshed every 30 seconds and on demand without blanking the table.
- `OptionsManager` - add and delete options with in-page delete confirmation.
- `AdminUnlock` - the admin unlock screen: **Unlock with passkey**, with admin-key sign-in as the fallback (shown directly when the browser lacks WebAuthn).
- `AddPasskeyOffer` - modal dialog shown after a key sign-in that offers to add a passkey for this device.
- `PasskeyList` - the Passkeys section on `/passkeys`: list, add, and remove with in-page confirmation.

### Hooks

- `useOptions`, `useLeaderboard` return `{ data, loading, error, refetch }`. Only the first load reports `loading`; in-flight requests are aborted on unmount.
- `useAdminSession` holds the admin session status in an in-memory store shared by every instance (no browser storage), checks `GET /api/admin/verify` on first mount, and exposes `unlockWithPasskey`, `unlockWithKey`, `addPasskey`, `lock` and `markSessionEnded`.
- `usePasskeys` lists and removes stored passkeys.
- `useBingoBoard` restores a valid saved board or generates one, persists every mark, and opens the win modal once per board.
- `useFocusTrap` traps focus in a container and handles Escape.

### Game logic (`src/game`)

- `board.ts` - Fisher-Yates shuffle and board generation (24 distinct options around a free center).
- `winLines.ts` - the 12 winning lines generated from the board size and `getHasWon`.
- `savedBoard.ts` - validation and parsing of the board persisted in `localStorage`; invalid data yields `null` so a new board is generated.
- `playerName.ts` - trim and whitespace collapse, 1-20 character check.

### Admin access

There are no nav links to the admin pages; admins visit `/cards`, `/stats` and `/passkeys` directly. All three show the unlock screen until `GET /api/admin/verify` succeeds. Unlocking sets an httpOnly session cookie, which authorizes every admin request; the client never holds the key or a token. A 401 returns to the unlock screen with "Your admin session ended. Unlock again." `/passkeys` holds the passkey list and the **Lock** button.

## Testing

Component tests mock `src/services/api.ts`; game logic is tested directly. Shared helpers live in `src/test/`: `setup.ts` (jest-dom matchers, cleanup, storage reset), `renderWithProviders.tsx`, `factories.ts`, `axiosErrors.ts`.
