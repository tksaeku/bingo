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

`VITE_API_URL` is the API base URL, read from `.env.development` / `.env.production`. When unset (production builds), `src/services/api.ts` uses the same-origin `/api`, because the server serves the client.

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
- `AdminKeyForm` - collects the admin key; the key is stored only after the server accepts it.

### Hooks

- `useOptions`, `useLeaderboard` return `{ data, loading, error, refetch }`. Only the first load reports `loading`; in-flight requests are aborted on unmount.
- `useAdminKey` holds the verified key in `sessionStorage` (shared across components) and exposes `verifyAndStore` and `clearAdminKey`.
- `useBingoBoard` restores a valid saved board or generates one, persists every mark, and opens the win modal once per board.
- `useFocusTrap` traps focus in a container and handles Escape.

### Game logic (`src/game`)

- `board.ts` - Fisher-Yates shuffle and board generation (24 distinct options around a free center).
- `winLines.ts` - the 12 winning lines generated from the board size and `getHasWon`.
- `savedBoard.ts` - validation and parsing of the board persisted in `localStorage`; invalid data yields `null` so a new board is generated.
- `playerName.ts` - trim and whitespace collapse, 1-20 character check.

### Admin access

The "Manage Options" link renders only while a verified key is in `sessionStorage`. `/options` shows the key form until `GET /api/admin/verify` accepts the key. Option writes send the key in the `x-admin-key` header; a 401 clears the stored key and returns to the form.

## Testing

Component tests mock `src/services/api.ts`; game logic is tested directly. Shared helpers live in `src/test/`: `setup.ts` (jest-dom matchers, cleanup, storage reset), `renderWithProviders.tsx`, `factories.ts`, `axiosErrors.ts`.
