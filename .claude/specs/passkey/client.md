# Passkey — client

The client mirrors server rules for UX only. It holds no secret: the session is an httpOnly cookie the browser sends on its own.

## Files

| File | What changes |
|---|---|
| `services/api.ts` | Admin calls drop their `adminKey` parameter (the cookie authorizes them). Gains `authApi` (`signInWithKey`, `signOut`, `getPasskeyOptions`, `verifyPasskey`) and `passkeysApi` (`getRegistrationOptions`, `register`, `list`, `remove`). It stays the only file that makes HTTP calls. |
| `services/passkeyCeremony.ts` (new) | The only file importing `@simplewebauthn/browser`. `getSupportsPasskeys()` wraps `browserSupportsWebAuthn()`. `unlockWithPasskey()` runs options → `startAuthentication({ optionsJSON })` → verify. `createPasskey(name?)` runs registration-options → `startRegistration({ optionsJSON })` → register. A `NotAllowedError` / `AbortError` from the browser maps to a `PasskeyDismissedError`, so the UI can show AC-P15's message. |
| `services/adminSessionStore.ts` (replaces `adminKeyStorage.ts`) | In-memory module store of `AdminSessionStatus` (`'checking' \| 'locked' \| 'unlocked'`) plus a message, with `subscribe`, for `useSyncExternalStore`. No browser storage. |
| `hooks/useAdminSession.ts` (replaces `useAdminKey.ts`) | Returns `{ status, isBusy, error, justSignedInWithKey, unlockWithPasskey, unlockWithKey, addPasskey, dismissAddPasskeyOffer, lock, markSessionEnded }`. The first mount while the status is `'checking'` calls `GET /api/admin/verify` (`204` → unlocked, `401` → locked). Every hook instance shares the store, so unlocking `/cards` also unlocks `/stats`. |
| `hooks/usePasskeys.ts` (new) | `{ data, loading, error, refetch }` for `GET /api/admin/passkeys`, plus `remove(id)`. Same shape as the other data hooks. |
| `components/AdminUnlock/` (replaces `AdminKeyForm/`) | The unlock screen (below). Keeps the current card styling and the per-page `description` prop. |
| `components/AddPasskeyOffer/` (new) | The post-key-sign-in prompt, shown as a modal dialog over the page (`styles/Modal.ts`, shared with `WinModal`): optional name input, **Add passkey**, **Not now**, and the add error inside the dialog. Focus moves into it and is trapped; Escape dismisses it unless a request is in flight. |
| `components/PasskeyList/` (new) | The `/passkeys` passkey section: rows with name, "Added Mon D", "Last used Mon D" or "Never used", and **Remove** with in-page confirmation; an **Add a passkey** button. Disabled while a request is in flight. |
| `pages/CardsPage`, `pages/StatsPage`, `pages/PasskeysPage` | Use `useAdminSession`. `'checking'` → loading state; `'locked'` → `AdminUnlock`; `'unlocked'` → the page content, plus `AddPasskeyOffer` when `justSignedInWithKey`. `PasskeysPage` (route `/passkeys`, no nav link) is the only page with `PasskeyList` and the **Lock** button, and disables every admin action on it while any one is in flight. `onUnauthorized` calls `markSessionEnded()`. |
| `components/OptionsManager`, `components/StatsDashboard`, `hooks/useOptions`, `hooks/useAnalyticsSummary` | Drop the `adminKey` prop/param. |
| `constants.ts` | Remove `ADMIN_KEY_STORAGE_KEY`. Add the AC-P15/AC-P17 messages. |
| `vite.config.ts`, `.env.development` | Add a dev proxy: `server.proxy['/api'] = 'http://localhost:5174'`. Remove `VITE_API_URL` from `.env.development` so the client uses the same-origin `/api` in dev as in production. |

## Unlock screen (`AdminUnlock`)

```
┌───────────────────────────────────────┐
│  Admin                                │
│  Unlock to manage the bingo cards.    │  ← description prop
│                                       │
│  [ 🔒 Unlock with passkey ]           │  ← primary; hidden without WebAuthn
│  Passkey prompt was dismissed.        │  ← status / error line
│                                       │
│  ▸ Use the admin key                  │  ← disclosure; open by default
│     Admin key [______________]        │     when passkeys are unsupported
│     [ Sign in ]                       │
└───────────────────────────────────────┘
```

- The passkey button calls `unlockWithPasskey`. The browser requires a user gesture, so the prompt never fires on page load.
- The key form's input is cleared after submit, success or failure (AC-P18).
- Error lines use `role="alert"`. Buttons are disabled while busy.

## Tests

Mock `services/passkeyCeremony.ts` in component and hook tests. jsdom has no WebAuthn, so `getSupportsPasskeys` is mocked to cover both branches. Cover:

- loading → locked → unlocked;
- dismissed vs. rejected passkey errors;
- the add-passkey offer appearing only after a key sign-in;
- a `401` returning to the unlock screen with the AC-P17 message;
- remove confirmation;
- that nothing is written to `sessionStorage` or `localStorage`.
