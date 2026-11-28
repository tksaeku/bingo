import type { AdminSessionStatus } from '../types';

/** Admin session state shared by every hook instance. */
export interface AdminSessionSnapshot {
  status: AdminSessionStatus;
  /** A line explaining why the session is locked, or null. */
  message: string | null;
}

/** Subscribers notified whenever the session snapshot changes. */
const listeners = new Set<() => void>();

/** Held in memory only; the session itself is an httpOnly cookie. */
let snapshot: AdminSessionSnapshot = { status: 'checking', message: null };

/** The current session snapshot; the reference changes only when the state changes. */
export function getAdminSessionSnapshot(): AdminSessionSnapshot {
  return snapshot;
}

/** Replaces the session state and notifies subscribers. */
export function setAdminSession(status: AdminSessionStatus, message: string | null = null): void {
  snapshot = { status, message };
  listeners.forEach((listener) => listener());
}

/** Subscribes to session changes (for useSyncExternalStore); returns the unsubscribe function. */
export function subscribeToAdminSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
