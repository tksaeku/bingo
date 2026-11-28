# Passkey — API contract

Same conventions as the main API in [`../../docs/spec.md`](../../docs/spec.md): base path `/api`, JSON bodies, errors are `{ "error": string }` (plus optional `"details"` for validation errors), 10 kb body limit (`413` above it).

"admin" in the Auth column means AC-P1: a valid session cookie or a valid `x-admin-key` header.

## Endpoints

| Method & path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /api/auth/session` | — | `{ "adminKey": string }` | `204` + session cookie | 400, 401, 429, 503 |
| `DELETE /api/auth/session` | — | — | `204`, session cookie cleared | 429 |
| `POST /api/auth/passkey/options` | — | — | `200 PublicKeyCredentialRequestOptionsJSON` + challenge cookie | 429, 503 |
| `POST /api/auth/passkey/verify` | — | `{ "response": AuthenticationResponseJSON }` | `204` + session cookie | 400, 401, 429, 503 |
| `POST /api/admin/passkeys/registration-options` | admin | — | `200 PublicKeyCredentialCreationOptionsJSON` + challenge cookie | 401, 429, 503 |
| `POST /api/admin/passkeys` | admin | `{ "response": RegistrationResponseJSON, "name"?: string }` | `201 AdminPasskey` + session cookie | 400, 401, 429, 503 |
| `GET /api/admin/passkeys` | admin | — | `200 AdminPasskey[]` | 401, 429, 503 |
| `DELETE /api/admin/passkeys/:id` | admin | — | `204` | 400 bad id, 401, 404, 429, 503 |
| `GET /api/admin/verify` | admin | — | `204` | 401, 429, 503 |

`GET /api/admin/verify`, `POST`/`DELETE /api/options` and `GET /api/admin/analytics` keep their current contracts. Only how "admin" is satisfied changes (AC-P1). The client uses `GET /api/admin/verify` as its "am I signed in?" check.

## Types

- **AdminPasskey** — `id` (string, the credential ID in base64url), `name` (string), `createdAt` (ISO string), `lastUsedAt` (ISO string or `null`).
- **`*JSON` types** — the SimpleWebAuthn JSON shapes (`@simplewebauthn/server` exports them). The server returns the options object it gets from `generateRegistrationOptions` / `generateAuthenticationOptions` unchanged, and the client passes it to `startRegistration` / `startAuthentication` as `optionsJSON`.

## Validation

| Field | Rule |
|---|---|
| `adminKey` | String, 1–200 chars |
| `name` | Optional string, 1–40 chars after trimming, no lone surrogates. Missing → the server names it `Passkey added <Mon D, YYYY>` (America/Los_Angeles date) |
| `response` | Object with string `id`, string `rawId`, `type: 'public-key'`, and an object `response`; shapes beyond that are checked by SimpleWebAuthn verification (failures → `400` for registration, `401` for sign-in) |
| `:id` | base64url string, 1–1023 chars |

## Ceremony options

Registration (`generateRegistrationOptions`):

- `rpName`: `Bingo admin`; `rpID`: `WEBAUTHN_RP_ID`
- `userName` and `userDisplayName`: `admin`; `userID`: the fixed bytes of `ADMIN_USER_HANDLE` (see [`data-model.md`](data-model.md))
- `attestationType: 'none'`
- `authenticatorSelection: { residentKey: 'required', userVerification: 'required' }`
- `excludeCredentials`: every stored passkey (`id`, `transports`)

Authentication (`generateAuthenticationOptions`):

- `rpID`: `WEBAUTHN_RP_ID`
- `userVerification: 'required'`
- `allowCredentials` omitted, so the browser offers any discoverable passkey for this host

Verification (`verifyRegistrationResponse` / `verifyAuthenticationResponse`):

- `expectedChallenge` from the challenge cookie
- `expectedOrigin`: `WEBAUTHN_ORIGINS` (array)
- `expectedRPID`: `WEBAUTHN_RP_ID`
- `requireUserVerification: true`
- Authentication looks up the stored passkey by `response.id` first; unknown ID → `401`.

## Status codes in detail

- `POST /api/auth/passkey/verify`: an expired or missing challenge, an unknown credential, or a failed verification all return `401` with `{ "error": "Passkey sign-in failed" }`, so the response says nothing about which check failed.
- `POST /api/admin/passkeys`: the same failures return `400` with `{ "error": "Passkey registration failed" }`. The caller is already authenticated, so this is a bad request, not an auth failure.
- `POST /api/admin/passkeys` with a credential ID that is already stored returns `400` (the browser's `excludeCredentials` normally prevents this).
