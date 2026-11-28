# Passkey — security

## Threats and how they're handled

| Threat | Handling |
|---|---|
| Stolen admin key | Still grants access (key sign-in and the `x-admin-key` header stay on). Rotating `ADMIN_KEY` invalidates the key and every session, because session signing keys derive from it. Passkeys survive a rotation. |
| Lost or stolen device | Delete its passkey on `/passkeys`; its sessions die on the next request (AC-P7). The device's biometric lock protects the passkey in the meantime. |
| Forged or tampered cookie | HMAC signature checked in constant time; payload parsed with Zod after the signature passes. Any failure means no session. |
| Replay of a captured assertion | The challenge is single-use per ceremony and expires in 5 minutes (AC-P5). A captured assertion is bound to the challenge in its cookie, which the verify response clears. |
| Phishing | WebAuthn binds the passkey to `WEBAUTHN_RP_ID`, and verification checks `expectedOrigin`. A look-alike domain can't use the passkey. |
| CSRF | `SameSite=Strict` session cookie, so cross-site requests carry no session. Same-origin JSON API. The CORS allow-list is unchanged and does not enable `credentials`. |
| XSS stealing the session | `HttpOnly` cookie, and the client never holds the key or a token (AC-P18). |
| Brute-forcing the key | `/api/auth/*` is limited to 10/min per IP, counted before the check (AC-P12). Key comparison is constant time. |
| Account enumeration through sign-in errors | Every passkey sign-in failure returns the same `401` message. |
| Server misconfiguration | `ADMIN_KEY` unset → `503` (fail closed). An RP ID or origin mismatch makes verification fail, never pass. |

## Cookie handling

- Parse incoming cookies with `cookie-parser` (no secret; the HMAC is ours).
- Set cookies with Express's `res.cookie` and clear them with `res.clearCookie`, using the same `path` and flags.
- `Secure` follows the origins rule in [`data-model.md`](data-model.md). On plain `http://localhost` it stays off so Safari keeps the cookie.

## Auth middleware order (`middleware/requireAdmin.ts`)

1. `ADMIN_KEY` unset → `503`.
2. An `x-admin-key` header is present → it decides: match → next, no match → `401`.
3. Session cookie present, signature valid, unexpired, and (when `credentialId` is set) the passkey exists → next.
4. Otherwise → `401`. When a cookie was present but invalid, clear it.

The limiter runs before this middleware, as it does today.

## Logging

Log failed verifications server-side with the reason (expired challenge, unknown credential, signature failure, counter regression), never the key, cookie values or credential public keys. Clients get only the generic messages in [`api.md`](api.md).
