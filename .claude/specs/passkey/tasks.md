# Passkey — implementation tasks

The tasks are ordered so each one leaves `npm run check` green. Server tasks (S) go to `tkserver-dev`, client tasks (C) to `tkclient-dev`. C1 needs only the contract in [`api.md`](api.md), so it can run in parallel with S1–S4. C2 onward needs S4 merged, because the client stops sending `x-admin-key` and relies on the cookie.

Check the current SimpleWebAuthn major version's docs (context7) before S2/C1; the function names in this spec match v13.

## Server

### S1 — Dependencies, constants, config

- Add `@simplewebauthn/server` and `cookie-parser` (+ `@types/cookie-parser`) to `server`.
- `server/src/constants.ts`: the constants listed in [`data-model.md`](data-model.md).
- `server/src/config.ts`:
  - `parseWebAuthnOrigins(value)` (comma-separated, trimmed, default `['http://localhost:5173']`);
  - `parseWebAuthnRpId(value)` (default `'localhost'`).
- `server/.env.example`: document `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGINS`.
- **Done when** unit tests cover both parsers.

### S2 — Signed cookies, the WebAuthn adapter, repository

- `features/adminAuth/signedToken.ts`:
  - `deriveSigningKey(adminKey, purpose)`;
  - `signToken(payload, key)`;
  - `readToken(value, key, schema)`, which returns the parsed payload or `null` on a bad signature, bad JSON, schema failure or expiry.
- `features/adminAuth/webAuthnAdapter.ts`: a `WebAuthnAdapter` interface with the four SimpleWebAuthn calls (`generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`), plus the default implementation that delegates to the library. `createApp` accepts an injected adapter.
- `repositories/repositoryTypes.ts`: an `AdminPasskeyRepository` (see [`data-model.md`](data-model.md)).
- `repositories/FirestoreAdminPasskeyRepository.ts`: with converters.
- `testSupport/FakeAdminPasskeyRepository.ts`: in memory, same semantics (duplicate create fails, `delete` returns `false` when missing).
- `testSupport/FakeWebAuthnAdapter.ts`: returns canned options and lets tests choose verified or failed results and counters.
- **Done when:**
  - token tests cover a valid round trip, a tampered payload, a tampered signature, the wrong key, expiry, and garbage input;
  - repository tests cover each method against `FakeFirestore`, including the duplicate-create rejection.

### S3 — Auth service and `requireAdmin`

- `features/adminAuth/adminAuthService.ts`, taking the repository, adapter, config and `getNow`:
  - `signInWithKey`;
  - `createAuthenticationOptions`;
  - `verifyAuthentication` (lookup, verify, `recordUse`);
  - `createRegistrationOptions`;
  - `registerPasskey`;
  - `listPasskeys`;
  - `deletePasskey`;
  - `readSession` (signature + expiry + credential-exists).
- Every method returns plain results; the handlers set cookies.
- `middleware/requireAdmin.ts` replaces `requireAdminKey.ts`, following the order in [`security.md`](security.md). Keep `getKeysMatch`.
- **Done when** service tests cover:
  - AC-P2;
  - AC-P3 (each failure path returns the same failure);
  - AC-P4, including `excludeCredentials` and the default name;
  - AC-P5 (wrong purpose, expired challenge);
  - AC-P6–P8 (counter and `lastUsedAt` updated; regression fails);
  - AC-P9 (no public key in the output).

  Middleware tests cover every branch of AC-P1.

### S4 — Routes and wiring

- `features/adminAuth/authRouter.ts` (`/api/auth`) and `features/adminAuth/passkeysRouter.ts` (`/api/admin/passkeys`), one handler file per endpoint, plus `adminAuthSchemas.ts` (Zod, per [`api.md`](api.md)).
- `app.ts`:
  - add `cookieParser()`;
  - create the auth limiter (`AUTH_LIMIT_PER_WINDOW`);
  - build `requireAdmin` and pass it everywhere `requireAdminKey` went (options, admin, analytics admin);
  - mount `/api/auth` and `/api/admin/passkeys` **before** `/api/admin`.
- `CreateAppOptions` gains `adminPasskeyRepository`, `webAuthn`, `webAuthnRpId` and `webAuthnOrigins`; `createTestApp` passes the fakes.
- Existing tests that send `x-admin-key` keep passing unchanged.
- **Done when** supertest covers:
  - every row of the endpoint table in [`api.md`](api.md);
  - cookie flags (`HttpOnly`, `SameSite=Strict`, `Path=/api`, `Max-Age`, `Secure` only for https origins);
  - an end-to-end cookie flow: key sign-in → `GET /api/admin/verify` 204 → register → delete that passkey → a session bound to it is `401`;
  - the auth limiter returning `429` on the 11th request;
  - `503` with `ADMIN_KEY` unset.

### S5 — Deployment config

- `apphosting.yaml`: add `WEBAUTHN_RP_ID=bingo.wemove.dance` and `WEBAUTHN_ORIGINS=https://bingo.wemove.dance` (RUNTIME).
- **Done when** the values match the production host in `CLAUDE.md`.

## Client

### C1 — API, ceremony and session store

- Add `@simplewebauthn/browser` to `client`.
- `services/api.ts`: `authApi` and `passkeysApi` per [`client.md`](client.md); drop `adminKey` from the existing admin calls.
- `services/passkeyCeremony.ts`.
- `services/adminSessionStore.ts`; delete `adminKeyStorage.ts` and its test.
- `vite.config.ts` dev proxy; remove `VITE_API_URL` from `.env.development`.
- **Done when:**
  - `api.test.ts` covers the new calls and confirms no admin call sends `x-admin-key`;
  - `passkeyCeremony` tests (library mocked) cover the dismissed-error mapping and the options → start → verify sequence.

### C2 — `useAdminSession`, `usePasskeys`

- Replace `useAdminKey` with `useAdminSession`; add `usePasskeys`.
- Drop `adminKey` from `useOptions` and `useAnalyticsSummary`.
- **Done when** hook tests cover:
  - the initial verify (204 and 401);
  - shared state across two hook instances;
  - key sign-in setting `justSignedInWithKey`;
  - `markSessionEnded` with the AC-P17 message;
  - `lock`.

### C3 — Unlock screen and page gating

- `AdminUnlock` (replacing `AdminKeyForm`) and `AddPasskeyOffer`.
- Wire both into `CardsPage` and `StatsPage` with the loading state and the **Lock** button.
- `OptionsManager` and `StatsDashboard` drop the `adminKey` prop.
- **Done when** component and page tests cover AC-P13–P18 and AC-P20, using the cases listed in [`client.md`](client.md).

### C4 — Passkey list on `/cards`

- `PasskeyList` with `usePasskeys`.
- **Done when** tests cover AC-P19: list rendering, "Never used", the remove confirmation, add, and disabled buttons while busy.

## Docs

### D1 — Fold into the product spec and project docs

- `docs/spec.md`:
  - rewrite AC-O1, AC-O2 and AC-O5 around the unlock screen;
  - add the new endpoints to the API table;
  - replace the "Admin auth" bullet with the session-or-key rule;
  - add the auth rate limit;
  - update the analytics paragraph's "same admin key" line.
- `.claude/specs/analytics/requirements.md` AC-A14 and `client.md`: point the gate at the unlock screen.
- `CLAUDE.md`:
  - add the `features/adminAuth/` and repository entries;
  - list `useAdminSession`/`usePasskeys` instead of `useAdminKey`;
  - add the new env vars and the dev proxy; drop `VITE_API_URL` from `.env.development`.
- **Done when** a grep for `useAdminKey`, `adminKeyStorage`, `ADMIN_KEY_STORAGE_KEY` and "stored key" across docs and code finds nothing.

## Rollout

1. Merge and deploy. The existing key still works everywhere, so nothing breaks mid-rollout.
2. On each device: visit `/passkeys` (or `/cards`), sign in with the admin key, accept **Add a passkey for this device**.
3. From then on, use **Unlock with passkey**.
