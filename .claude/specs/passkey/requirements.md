# Passkey — requirements

## Goals

1. On a device that has been set up, the admin opens `/cards` or `/stats` and unlocks with one biometric prompt. No typing. The same passkey and the same session cover both pages: a passkey added on either page unlocks both, and unlocking one page unlocks the other.
2. Setting up a new device takes the admin key once, then one biometric prompt.
3. A lost or retired device can be cut off without rotating the admin key.
4. Nothing about the admin pages gets weaker than the current shared-key check: the server enforces every rule, and the client only mirrors them.

## Non-goals

See the out-of-scope list in [`README.md`](README.md).

## Flows

### Unlock (device already set up)

1. Admin visits `/cards` or `/stats`. The page checks the session (`GET /api/admin/verify`).
2. No valid session → the unlock screen shows **Unlock with passkey**.
3. Click → the browser's passkey prompt → biometric → the server verifies and sets the session cookie → the page shows its content.

### Set up a new device

1. On the unlock screen, admin opens **Use the admin key**, enters the key, submits.
2. The server checks the key and sets a session cookie. The page unlocks.
3. Right after a key sign-in on a browser that supports passkeys, the page opens a modal dialog, **Add a passkey for this device**, with an optional name field and a **Not now** control.
4. **Add** → the browser's passkey creation prompt → biometric → the server stores the passkey and re-issues the session bound to it.

### Remove a device

1. On `/passkeys`, the **Passkeys** section lists each passkey: name, added date, last used.
2. **Remove** → in-page confirmation → the passkey is deleted, and any session that was unlocked with it stops working on its next request.

### Lock

`/passkeys` shows a **Lock** control that ends the session in this browser.

## Acceptance criteria

### Server

- **AC-P1** Admin endpoints (`/api/options` writes, `/api/admin/*`) accept a valid admin session cookie **or** a valid `x-admin-key` header. When the header is present it alone decides the outcome (a wrong header is `401` even with a valid cookie). Neither present or valid → `401`. `ADMIN_KEY` unset → `503` for admin endpoints and all `/api/auth/*` endpoints except `DELETE /api/auth/session` (fail closed).
- **AC-P2** `POST /api/auth/session` with the correct admin key sets a session cookie and returns `204`; a wrong key returns `401` and sets nothing. The key is compared in constant time.
- **AC-P3** Passkey sign-in (`POST /api/auth/passkey/options` then `POST /api/auth/passkey/verify`) sets a session cookie only when SimpleWebAuthn verifies the assertion against a stored passkey, the challenge cookie is valid, unexpired, and for authentication, and user verification was performed. Any failure returns `401` with a generic message and clears the challenge cookie.
- **AC-P4** Registration (`POST /api/admin/passkeys/registration-options` then `POST /api/admin/passkeys`) requires admin auth (AC-P1). It requires a resident key and user verification, excludes passkeys already stored, and stores the new passkey only after verification succeeds. On success it returns `201` with the passkey and re-issues the session cookie bound to the new credential.
- **AC-P5** Challenges are single-use per ceremony: each verify call clears the challenge cookie whether it succeeds or fails, and a challenge issued for registration is rejected by authentication verify and vice versa.
- **AC-P6** A session expires 12 hours after it was issued. An expired, malformed or wrongly signed cookie is treated as no session (`401`) and the response clears it.
- **AC-P7** A session bound to a credential ID is valid only while that passkey exists. Deleting the passkey makes the next request with that session `401`.
- **AC-P8** On each passkey sign-in the stored signature counter and `lastUsedAt` are updated. A counter regression reported by SimpleWebAuthn fails the sign-in.
- **AC-P9** `GET /api/admin/passkeys` lists passkeys (id, name, createdAt, lastUsedAt, newest first) and never returns public keys. `DELETE /api/admin/passkeys/:id` removes one (`204`, `404` when missing).
- **AC-P10** `DELETE /api/auth/session` clears the session cookie and returns `204`, with or without a valid session.
- **AC-P11** Every request body and `:id` param is validated with Zod at the boundary (same rules as the rest of the API: ill-formed input is `400`, never `500`).
- **AC-P12** `/api/auth/*` is rate limited to 10 requests/min per IP, counted before any check. `/api/admin/passkeys*` uses the existing admin limiter (30/min per IP).

### Client

- **AC-P13** `/cards`, `/stats` and `/passkeys` render the unlock screen until `GET /api/admin/verify` succeeds, and render a neutral loading state while that first check runs (no flash of the unlock screen for a signed-in browser). Unlocking on any of them unlocks all three.
- **AC-P14** The unlock screen's primary action is **Unlock with passkey**. When the browser does not support WebAuthn, the passkey action is hidden and the admin-key form is shown directly.
- **AC-P15** A cancelled or timed-out passkey prompt shows a short, non-alarming message ("Passkey prompt was dismissed.") and leaves the screen usable. A server rejection shows "That passkey wasn't recognized." When adding a passkey on a device that already holds one of the app's passkeys (for example, one synced through Google Password Manager or iCloud Keychain), the browser refuses and the dialog shows "This device already has a passkey for bingo. Lock, then use Unlock with passkey."
- **AC-P16** After a key sign-in on a browser that supports passkeys, the page offers to add a passkey for this device. Dismissing the offer keeps the page unlocked.
- **AC-P17** A `401` from any admin request returns the page to the unlock screen with "Your admin session ended. Unlock again." (replaces AC-O5's key-clearing behavior).
- **AC-P18** The client never stores the admin key: not in `sessionStorage`, `localStorage`, or a cookie it can read. The key lives only in the form input until submitted.
- **AC-P19** `/passkeys` (no nav link) shows a **Passkeys** section listing the stored passkeys with remove (in-page confirmation, no `window.confirm`) and an **Add a passkey** action. Buttons are disabled while a request is in flight.
- **AC-P20** `/passkeys` shows a **Lock** control (`/cards` and `/stats` do not) that calls `DELETE /api/auth/session` and returns to the unlock screen.
