# 🎯 Bingo

A casual 5×5 bingo game. Mark cells on a randomly generated board, submit your name when you win, and climb the shared leaderboard. An admin manages the pool of bingo options.

## Features

- **Bingo board** — 5×5 grid with a free center cell, randomly drawn from the option pool, saved across reloads, with automatic win detection on rows, columns and diagonals
- **Win celebration** — confetti, name submission and a fresh board to play again
- **Leaderboard** — top 20 players by wins, auto-refreshing
- **Option management** — admin-only page, unlocked with the admin key

## Tech stack

- **Client** — React 19, TypeScript, Vite, React Router, styled-components, axios
- **Server** — Node 24, Express 5, TypeScript, Firestore (Firebase Admin SDK), Zod
- **Testing** — Vitest, Testing Library, supertest

## Getting started

Prerequisites: Node 24+, and access to a Firebase project with Firestore (or the Firestore emulator).

```bash
npm install
cp server/.env.example server/.env   # then fill in ADMIN_KEY and credentials
npm run dev
```

This starts the API on http://localhost:5174 and the client on http://localhost:5173.

### Server environment (`server/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5174`) |
| `ADMIN_KEY` | Shared secret required to add or delete options. Admin endpoints are disabled when unset. |
| `CORS_ORIGINS` | Comma-separated cross-origin allow-list (default `http://localhost:5173`; production is same-origin) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to a service-account JSON for local development (overrides any machine-wide `GOOGLE_APPLICATION_CREDENTIALS`) |
| `FIRESTORE_EMULATOR_HOST` | Set (e.g. `localhost:8080`) to use the Firestore emulator instead of a real project |

### Client environment

The Vite dev server proxies `/api` to the local API on `:5174`, so the client always calls the same-origin `/api`, in dev and production.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run server and client in watch mode |
| `npm run build` | Build server and client |
| `npm start` | Run the built server |
| `npm run check` | Typecheck, lint and test both packages (the CI gate) |
| `npm test` | Run all tests |
| `npm run format` | Format with Prettier |
| `npm run seed -w server` | Seed default options (emulator, or pass `--yes`) |

## Playing

1. An admin opens `/options`, enters the admin key and adds at least 24 options.
2. Players open **Play**, click cells to mark them, and complete a row, column or diagonal to win.
3. Winners enter their name and appear on the **Leaderboard**.

## Deployment

- The app runs on Firebase App Hosting (backend `bingo`) at https://bingo.wemove.dance, built from `main` with `apphosting.yaml`. One Express server serves both the API and the client build, so every rollout ships them together.
- `ADMIN_KEY` is read from the Secret Manager secret `bingo-admin-key`.

See [`CLAUDE.md`](CLAUDE.md) for architecture and [`.claude/docs/spec.md`](.claude/docs/spec.md) for the full API contract.

## License

GPL-3.0 — see [LICENSE](LICENSE).
