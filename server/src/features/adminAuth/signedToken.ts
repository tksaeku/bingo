import { createHmac, timingSafeEqual } from 'node:crypto';
import type { z } from 'zod';

/** Derives a purpose-specific signing key: HMAC-SHA256(adminKey, purpose). */
export function deriveSigningKey(adminKey: string, purpose: string): Buffer {
  return createHmac('sha256', adminKey).update(purpose).digest();
}

/** HMAC-SHA256 of a base64url payload segment under `key`. */
function signPayloadSegment(payloadSegment: string, key: Buffer): Buffer {
  return createHmac('sha256', key).update(payloadSegment).digest();
}

/** Serializes a payload as `<base64url(JSON)>.<base64url(HMAC-SHA256)>`. */
export function signToken(payload: unknown, key: Buffer): string {
  const payloadSegment = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${payloadSegment}.${signPayloadSegment(payloadSegment, key).toString('base64url')}`;
}

/**
 * Verifies and parses a signed token. Returns null for a missing value, malformed token, bad
 * signature, bad JSON, schema failure or a payload whose `expiresAt` (epoch ms) is not after `nowMs`.
 */
export function readToken<Payload extends { expiresAt: number }>(
  value: unknown,
  key: Buffer,
  schema: z.ZodType<Payload>,
  nowMs: number = Date.now(),
): Payload | null {
  if (typeof value !== 'string') {
    return null;
  }
  const segments = value.split('.');
  if (segments.length !== 2) {
    return null;
  }
  const [payloadSegment, signatureSegment] = segments;
  const expectedSignature = signPayloadSegment(payloadSegment, key);
  const actualSignature = Buffer.from(signatureSegment, 'base64url');
  if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) {
    return null;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const result = schema.safeParse(parsedJson);
  if (!result.success || result.data.expiresAt <= nowMs) {
    return null;
  }
  return result.data;
}
