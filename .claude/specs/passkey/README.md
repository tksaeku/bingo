# Passkey — biometric unlock for the admin pages

The admin pages, `/cards`, `/stats` and `/passkeys`, unlock with a passkey (Face ID, Touch ID, Windows Hello, a security key) instead of a typed secret. The shared `ADMIN_KEY` is only needed once per device, to sign in and register that device's passkey; after that, unlocking is one biometric prompt. A successful unlock gives the browser an httpOnly session cookie, and every admin request is authorized by that cookie.

This spec is the acceptance criteria for dev and review agents, alongside the product spec in [`../../docs/spec.md`](../../docs/spec.md). When this feature ships, the parts that describe shipped behavior get folded into `docs/spec.md` (task D1).

## Files

| File | What it covers |
|---|---|
| [`requirements.md`](requirements.md) | Goals, scope, user flows, and acceptance criteria (`AC-P*`) |
| [`api.md`](api.md) | The auth, session and passkey endpoints, and how existing admin endpoints authorize |
| [`data-model.md`](data-model.md) | The `adminPasskeys` Firestore collection, the session and challenge cookies, configuration |
| [`security.md`](security.md) | Cookie flags, signing, CSRF, rate limiting, revocation, failure modes |
| [`client.md`](client.md) | The unlock screen, the session hook, the passkey list, dev proxy |
| [`tasks.md`](tasks.md) | Groomed, ordered implementation tasks with done-criteria |

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Build vs. buy | Build it, on the open-source **SimpleWebAuthn** library (`@simplewebauthn/server`, `@simplewebauthn/browser`) | Hosted passkey services (Hanko, Corbado, Auth0) are user-management platforms: redirects or widgets, a vendor config per app, free tiers that can change. For one admin guarding two pages, a small in-app implementation is less to run. SimpleWebAuthn handles the WebAuthn cryptography and browser handshake. |
| Scope across apps | Passkeys are per app | Each app registers its own passkeys under its own domain. The code lives in one server feature folder plus a few client files, so the next app can copy it. |
| Relying party ID | The app's own host: `bingo.wemove.dance` in production, `localhost` in dev | Per-app passkeys, so no parent-domain sharing. Passkeys made on one host don't work on another (including the `*.hosted.app` URL). |
| Bootstrap | The admin key signs a device in; that session then registers the device's passkey | Registering needs some proof of admin. The key is that proof, used once per device. |
| Key fallback | Key sign-in stays available on the unlock screen, and the `x-admin-key` header still authorizes API calls | Works on a browser without passkey support, on the `*.hosted.app` URL, and for `curl`/scripts. The everyday path is the passkey button. |
| Session | Stateless HMAC-signed cookie, 12-hour lifetime, signing key derived from `ADMIN_KEY` | No session store needed across the two App Hosting instances. Rotating `ADMIN_KEY` signs every browser out. No new secret to provision. |
| Ceremony challenges | Signed, httpOnly, 5-minute cookie | Stateless across instances; no Firestore round trip for a value that lives seconds. |
| Revocation | Sessions carry the passkey's credential ID; deleting a passkey ends its sessions | Losing a phone means deleting its passkey from the list on `/passkeys`. |
| Dev setup | Vite dev server proxies `/api` to the Express server | Dev becomes same-origin like production, so cookies and the WebAuthn origin behave the same in both. |

## Out of scope

- Multiple admin accounts or roles. There is one admin identity; every passkey belongs to it.
- Sharing passkeys across apps or subdomains.
- Account recovery beyond the admin key (the key is the recovery path).
- Passkey autofill in the browser (conditional UI). Unlocking is a button press.
- Attestation (checking authenticator make and model). Attestation is `none`.
- Changing the player-facing app. Players never see any of this.
