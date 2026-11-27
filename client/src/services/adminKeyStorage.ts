import { ADMIN_KEY_STORAGE_KEY } from '../constants';

/** Subscribers notified whenever the stored admin key changes. */
const listeners = new Set<() => void>();

/** Notifies subscribers that the stored key changed. */
function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

/** The verified admin key held in sessionStorage, or null. */
export function getStoredAdminKey(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Stores a key that has already been verified by the server. */
export function storeAdminKey(adminKey: string): void {
  try {
    sessionStorage.setItem(ADMIN_KEY_STORAGE_KEY, adminKey);
  } catch {
    // Without storage the key cannot persist; callers see no stored key.
  }
  notifyListeners();
}

/** Removes the stored key. */
export function clearStoredAdminKey(): void {
  try {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
  notifyListeners();
}

/** Subscribes to key changes (for useSyncExternalStore); returns the unsubscribe function. */
export function subscribeToAdminKey(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
