import { z } from 'zod';
import { MAX_PASSKEY_NAME_LENGTH } from '../../constants';
import { getIsWellFormed } from '../../utils/normalize';

/** Body of POST /api/auth/session. */
export const keySignInBodySchema = z.object({
  adminKey: z.string().min(1, 'Admin key is required').max(200, 'Admin key is too long'),
});

/** A WebAuthn credential JSON; fields beyond the envelope are checked by SimpleWebAuthn verification. */
const credentialResponseSchema = z.looseObject({
  id: z.string(),
  rawId: z.string(),
  type: z.literal('public-key'),
  response: z.looseObject({}),
});

/** Body of POST /api/auth/passkey/verify. */
export const passkeyVerifyBodySchema = z.object({
  response: credentialResponseSchema,
});

/** Body of POST /api/admin/passkeys. */
export const registerPasskeyBodySchema = z.object({
  response: credentialResponseSchema,
  name: z
    .string()
    .refine(getIsWellFormed, 'Name contains invalid characters')
    .trim()
    .min(1, 'Name is required')
    .max(MAX_PASSKEY_NAME_LENGTH, `Name must be at most ${MAX_PASSKEY_NAME_LENGTH} characters`)
    .optional(),
});

/** A base64url credential ID of 1-1023 characters, safe to use as a Firestore document ID. */
export const credentialIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,1023}$/, 'Invalid id');

/** Params of DELETE /api/admin/passkeys/:id: a base64url credential ID. */
export const passkeyIdParamsSchema = z.object({
  id: credentialIdSchema,
});

/** Payload of the signed session cookie. */
export const sessionPayloadSchema = z.object({
  credentialId: z.string().nullable(),
  expiresAt: z.number(),
});

/** Payload of the signed challenge cookie. */
export const challengePayloadSchema = z.object({
  challenge: z.string(),
  purpose: z.enum(['registration', 'authentication']),
  expiresAt: z.number(),
});

/** The ceremony a challenge cookie was issued for. */
export type ChallengePurpose = z.infer<typeof challengePayloadSchema>['purpose'];
