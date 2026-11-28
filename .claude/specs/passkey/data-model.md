# Passkey — data model and configuration

## Firestore: `adminPasskeys`

One document per registered passkey. Document ID = the credential ID (base64url), so lookup on sign-in is a single `get`.

| Field | Type | Notes |
|---|---|---|
| `publicKey` | string | base64url of the COSE public key (`registrationInfo.credential.publicKey`) |
| `counter` | number | Signature counter. Platform passkeys (iCloud Keychain, Google Password Manager) usually report `0` forever; SimpleWebAuthn handles that |
| `transports` | string[] | From the registration response; passed back in `excludeCredentials` |
| `name` | string | Shown in the passkey list |
| `createdAt` | Timestamp | Converted to an ISO string by the repository converter |
| `lastUsedAt` | Timestamp \| null | Set on each successful sign-in |

Volume is a handful of documents, read once per sign-in plus once per admin request (AC-P7). No index or TTL is needed. `firestore.rules` already denies all client access, and only the Admin SDK touches this collection.

Repository (`repositories/FirestoreAdminPasskeyRepository.ts`, interface in `repositoryTypes.ts`):

- `list(): Promise<StoredAdminPasskey[]>` — newest first
- `get(id): Promise<StoredAdminPasskey | null>`
- `create(passkey): Promise<StoredAdminPasskey>` — fails when the ID exists (run inside a transaction or use `create()`, which rejects existing docs)
- `recordUse(id, counter, usedAt): Promise<void>`
- `delete(id): Promise<boolean>` — `false` when missing

`StoredAdminPasskey` includes `publicKey`, `counter` and `transports`. The service maps it to the public `AdminPasskey` shape, which has none of them.

## Admin identity

There is one admin. `ADMIN_USER_HANDLE` is a constant (`'bingo-admin'`, encoded as UTF-8 bytes) used as the WebAuthn `userID`, so every passkey belongs to the same user and a device keeps one passkey for this app.

## Cookies

Both cookies are signed the same way: `<base64url(JSON payload)>.<base64url(HMAC-SHA256(payload))>`. The signature is checked with `timingSafeEqual`. Each cookie type has its own signing key, derived from `ADMIN_KEY`:

- session key = `HMAC-SHA256(ADMIN_KEY, 'bingo-admin-session')`
- challenge key = `HMAC-SHA256(ADMIN_KEY, 'bingo-webauthn-challenge')`

### `bingo_admin_session`

| Payload field | Type | Notes |
|---|---|---|
| `credentialId` | string \| null | The passkey used to unlock; `null` for a key sign-in |
| `expiresAt` | number | Epoch ms, issue time + 12 h |

Flags: `HttpOnly`, `SameSite=Strict`, `Path=/api`, `Max-Age=43200`, `Secure` when every `WEBAUTHN_ORIGINS` entry is `https:`.

### `bingo_webauthn_challenge`

| Payload field | Type | Notes |
|---|---|---|
| `challenge` | string | From the generated options |
| `purpose` | `'registration'` \| `'authentication'` | Verify rejects the wrong purpose (AC-P5) |
| `expiresAt` | number | Epoch ms, issue time + 5 min |

Flags: same as the session cookie, with `Max-Age=300`. It's cleared on every verify response.

## Configuration

| Env var | Default | Production (`apphosting.yaml`) |
|---|---|---|
| `ADMIN_KEY` | — (unset fails closed) | Secret `bingo-admin-key` (unchanged) |
| `WEBAUTHN_RP_ID` | `localhost` | `bingo.wemove.dance` |
| `WEBAUTHN_ORIGINS` | `http://localhost:5173` | `https://bingo.wemove.dance` |

`WEBAUTHN_ORIGINS` is comma-separated, parsed like `CORS_ORIGINS`. `createApp` options accept `webAuthnRpId`, `webAuthnOrigins` and an injected `adminPasskeyRepository` and `webAuthn` adapter (see [`tasks.md`](tasks.md) S2) so tests run without real authenticators.

Constants (`server/src/constants.ts`): `ADMIN_PASSKEYS_COLLECTION`, `ADMIN_SESSION_COOKIE`, `WEBAUTHN_CHALLENGE_COOKIE`, `ADMIN_SESSION_TTL_MS = 43_200_000`, `WEBAUTHN_CHALLENGE_TTL_MS = 300_000`, `ADMIN_USER_HANDLE`, `WEBAUTHN_RP_NAME = 'Bingo admin'`, `AUTH_LIMIT_PER_WINDOW = 10`, `MAX_PASSKEY_NAME_LENGTH = 40`.
