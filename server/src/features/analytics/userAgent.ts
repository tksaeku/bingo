import type { DeviceType } from '../../types';

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|curl|wget|python-requests|httpclient|okhttp|go-http-client|node-fetch|axios\/|postman/i;
const TABLET_PATTERN = /iPad|Tablet/i;
const MOBILE_PATTERN = /Mobi|iPhone|iPod/i;

/** True when the User-Agent is missing or looks like honest automation (crawler, previewer, HTTP library). */
export function getIsBot(userAgent: string | undefined): boolean {
  return userAgent === undefined || userAgent.trim() === '' || BOT_PATTERN.test(userAgent);
}

/** Derives the device type from a User-Agent; no UA is stored. */
export function getDeviceType(userAgent: string | undefined): DeviceType {
  const value = userAgent ?? '';
  const isAndroid = /Android/i.test(value);
  if (TABLET_PATTERN.test(value) || (isAndroid && !/Mobile/i.test(value))) {
    return 'tablet';
  }
  if (MOBILE_PATTERN.test(value) || isAndroid) {
    return 'mobile';
  }
  return 'desktop';
}
