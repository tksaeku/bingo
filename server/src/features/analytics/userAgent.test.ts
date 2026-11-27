import { describe, expect, it } from 'vitest';
import { getDeviceType, getIsBot } from './userAgent';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID_PHONE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X900) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';

describe('userAgent', () => {
  describe('getIsBot', () => {
    it.each([undefined, '', '   '])('treats a missing User-Agent (%j) as a bot', (userAgent) => {
      expect(getIsBot(userAgent)).toBe(true);
    });

    it.each([
      'Googlebot/2.1',
      'Slackbot-LinkExpanding 1.0',
      'curl/8.4.0',
      'Wget/1.21',
      'python-requests/2.31',
      'Go-http-client/2.0',
      'node-fetch/1.0',
      'axios/1.6.0',
      'PostmanRuntime/7.36',
      'Mozilla/5.0 HeadlessChrome/120',
      'Chrome-Lighthouse',
      'Facebook External Hit link preview',
      'okhttp/4.12',
    ])('matches %s', (userAgent) => {
      expect(getIsBot(userAgent)).toBe(true);
    });

    it.each([IPHONE, IPAD, ANDROID_PHONE, MAC])('lets real browsers through', (userAgent) => {
      expect(getIsBot(userAgent)).toBe(false);
    });
  });

  describe('getDeviceType', () => {
    it('detects tablets: iPad, Tablet, and Android without Mobile', () => {
      expect(getDeviceType(IPAD)).toBe('tablet');
      expect(getDeviceType('Mozilla/5.0 (Windows NT 10.0) Tablet PC')).toBe('tablet');
      expect(getDeviceType(ANDROID_TABLET)).toBe('tablet');
    });

    it('detects phones: iPhone, iPod, Mobi, and Android with Mobile', () => {
      expect(getDeviceType(IPHONE)).toBe('mobile');
      expect(getDeviceType('Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0)')).toBe('mobile');
      expect(getDeviceType(ANDROID_PHONE)).toBe('mobile');
      expect(getDeviceType('Opera/9.80 (J2ME/MIDP; Opera Mini) Mobi')).toBe('mobile');
    });

    it('treats everything else, including a Mac UA, as desktop', () => {
      expect(getDeviceType(MAC)).toBe('desktop');
      expect(getDeviceType(undefined)).toBe('desktop');
    });
  });
});
