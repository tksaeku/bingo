# CLAUDE.md

Bingo — a casual 5×5 bingo game. Players mark cells on a randomly generated board, submit their name on a win, and appear on a shared leaderboard. An admin manages the pool of bingo options behind a shared admin key.

Product behavior and the API contract live in [`.claude/docs/spec.md`](.claude/docs/spec.md) — that file is the acceptance criteria for dev and review agents.

## Stack

| Package | Tech |
|---|---|
| `client/` | React 19 + TypeScript, Vite 7, React Router 7 (`react-router-dom`), styled-components, axios, Vitest + Testing Library (jsdom) |
| `server/` | Express 5 + TypeScript, Firebase Admin SDK (Firestore), Zod, express-rate-limit, Vitest + supertest |

npm workspaces (`client`, `server`) with a single root `package-lock.json`. Node 24.

## Commands (run from repo root)

```bash
npm run dev          # server (tsx watch, :5174) + client (vite, :5173)
npm run build        # build server then client
npm start            # run built server (what App Hosting runs)
npm run typecheck    # tsc --noEmit in both packages
npm run lint         # eslint in both packages
npm test             # vitest run in both packages
npm run check        # typecheck + lint + test (the CI gate)
npm run format       # prettier --write
```

Per package: `npm run <script> -w client` / `-w server`. Seed options: `npm run seed -w server` (refuses to run against a real project without `--yes`).

## Architecture

### Server (`server/src/`)

Layered route → service → repository:

- `index.ts` — entry point; loads env, calls `createApp()`, listens on `PORT`.
- `app.ts` — `createApp()` factory: CORS allow-list, JSON body limit, rate limiting, feature routers, the built client (static files + SPA fallback via `middleware/serveClient.ts`, skipped when `client/dist` is missing), 404 + error middleware. Tests import this directly.
- `features/<feature>/` — one folder per resource (`options`, `leaderboard`, `admin`): router assembler, one handler file per endpoint, a service holding business rules, Zod schemas, co-located `.test.ts` files.
- `repositories/` — the only code that touches Firestore (one class per PascalCase file). Typed converters map Firestore `Timestamp` → ISO strings.
- `testSupport/` — in-memory fake repositories and `createTestApp` for supertest; excluded from the build.
- `scripts/` — `seed.ts` and `migrateLeaderboard.ts` (dry run unless `--apply`).
- `middleware/` — `requireAdminKey`, error handler, validation helper, rate limiters, `serveClient`.
- `services/firestore.ts` — Admin SDK init from `FIREBASE_SERVICE_ACCOUNT_PATH` locally, otherwise Application Default Credentials (ambient on App Hosting). Honors `FIRESTORE_EMULATOR_HOST`.

### Client (`client/src/`)

Thin client — all rules that matter (validation, dedupe, win counting, auth) are enforced by the server; the client mirrors them only for UX.

- `components/<Name>/` — folder per component: `<Name>.tsx`, `<Name>.styles.ts` (styled-components), `<Name>.test.tsx`.
- `pages/` — route-level components.
- `hooks/` — data hooks (`useOptions`, `useLeaderboard`, `useAdminKey`) returning `{ data, loading, error, refetch }`.
- `game/` — pure, framework-free game logic (board generation, win detection, saved-board validation).
- `services/api.ts` — the only place that calls the HTTP API.
- `types.ts`, `constants.ts`, `theme.ts` — shared types, constants and design tokens.

## Deployment

- Firebase App Hosting backend `bingo` (project `wemove-ba867`, region us-east4) builds from the GitHub repo on push to `main`, using `apphosting.yaml`: `npm run build` (server + client) then `npm start`. The Express server serves both `/api/*` and the client, so one rollout ships both and the client calls the API same-origin (`/api`).
- Public URL: `https://bingo.wemove.dance` (custom domain on the App Hosting backend; DNS at DreamHost). Backend URL: `https://bingo--wemove-ba867.us-east4.hosted.app`.
- `ADMIN_KEY` comes from the Secret Manager secret `bingo-admin-key`.
- The Firebase project is shared with WeMove, and its Firebase Hosting site is WeMove's. Never run `firebase deploy` (Hosting, Firestore rules/indexes) from this repo; `firebase.json` only configures emulators.

## Environment

- `server/.env` (see `server/.env.example`): `PORT`, `ADMIN_KEY`, `CORS_ORIGINS`, `TRUSTED_PROXY_HOPS`, `FIREBASE_SERVICE_ACCOUNT_PATH`, `FIRESTORE_EMULATOR_HOST`.
- `client/.env.development`: `VITE_API_URL` (the local API). Production builds leave it unset and use the same-origin `/api`.
- The repo is **public** — never commit keys, `.env` files or `serviceAccountKey.json`.

## Conventions

Follow the `/tkjs` skill (TypeScript conventions, naming, folder-per-component, styled-components) and `/tkgithub` for git. Prettier config is `.prettierrc` at the root.
