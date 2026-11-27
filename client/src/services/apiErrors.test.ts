import axios, { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { createAxiosError } from '../test/axiosErrors';
import { getErrorMessage, getErrorStatus, getIsCanceled, getIsUnauthorized } from './apiErrors';

describe('getErrorMessage', () => {
  it('uses the server error text when the body has one', () => {
    expect(getErrorMessage(createAxiosError(409, 'Duplicate'), 'fallback')).toBe('Duplicate');
  });

  it('returns a connectivity message when there is no response', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(getErrorMessage(error, 'fallback')).toMatch(/could not reach the server/i);
  });

  it('returns the fallback when the body has no error string', () => {
    const error = createAxiosError(500, 'x');
    error.response!.data = { message: 'nope' };
    expect(getErrorMessage(error, 'fallback')).toBe('fallback');
    error.response!.data = { error: 42 };
    expect(getErrorMessage(error, 'fallback')).toBe('fallback');
    error.response!.data = null;
    expect(getErrorMessage(error, 'fallback')).toBe('fallback');
  });

  it('returns the fallback for non-axios errors', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
    expect(getErrorMessage('text', 'fallback')).toBe('fallback');
  });
});

describe('getErrorStatus and getIsUnauthorized', () => {
  it('reads the HTTP status', () => {
    expect(getErrorStatus(createAxiosError(422, 'Full'))).toBe(422);
    expect(getIsUnauthorized(createAxiosError(401, 'No'))).toBe(true);
    expect(getIsUnauthorized(createAxiosError(403, 'No'))).toBe(false);
  });

  it('is undefined for non-HTTP failures', () => {
    expect(getErrorStatus(new Error('x'))).toBeUndefined();
    expect(getErrorStatus(new AxiosError('Network Error'))).toBeUndefined();
  });
});

describe('getIsCanceled', () => {
  it('recognizes axios cancellations only', () => {
    expect(getIsCanceled(new axios.CanceledError())).toBe(true);
    expect(getIsCanceled(new Error('x'))).toBe(false);
    expect(getIsCanceled(createAxiosError(500, 'x'))).toBe(false);
  });
});
