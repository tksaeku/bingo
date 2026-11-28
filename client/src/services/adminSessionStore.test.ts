import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAdminSessionSnapshot,
  setAdminSession,
  subscribeToAdminSession,
} from './adminSessionStore';

describe('adminSessionStore', () => {
  afterEach(() => {
    setAdminSession('checking');
  });

  it('starts in the checking state with no message', () => {
    expect(getAdminSessionSnapshot()).toEqual({ status: 'checking', message: null });
  });

  it('stores a status and message and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAdminSession(listener);

    setAdminSession('locked', 'Session ended');

    expect(getAdminSessionSnapshot()).toEqual({ status: 'locked', message: 'Session ended' });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('keeps the snapshot reference stable between changes', () => {
    setAdminSession('unlocked');

    expect(getAdminSessionSnapshot()).toBe(getAdminSessionSnapshot());
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    subscribeToAdminSession(listener)();

    setAdminSession('unlocked');

    expect(listener).not.toHaveBeenCalled();
  });

  it('writes nothing to browser storage', () => {
    setAdminSession('unlocked');

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
