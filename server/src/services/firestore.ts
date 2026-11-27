import path from 'node:path';
import { applicationDefault, cert, getApps, initializeApp, type Credential } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/** Project ID used when running against the Firestore emulator. */
const EMULATOR_PROJECT_ID = 'demo-bingo';

/**
 * Resolves the Admin SDK credential.
 * `FIREBASE_SERVICE_ACCOUNT_PATH` (resolved against the working directory) takes precedence so a
 * machine-wide `GOOGLE_APPLICATION_CREDENTIALS` belonging to another project cannot leak in;
 * otherwise Application Default Credentials are used (ambient credentials on App Hosting).
 */
function getCredential(): Credential {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    return cert(path.resolve(serviceAccountPath));
  }
  return applicationDefault();
}

/**
 * Returns the Firestore instance, initializing the Admin SDK on first use.
 * When FIRESTORE_EMULATOR_HOST is set, no credentials are needed and the emulator is used.
 */
export function getDatabase(): Firestore {
  if (getApps().length === 0) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? EMULATOR_PROJECT_ID });
    } else {
      initializeApp({ credential: getCredential() });
    }
  }
  return getFirestore();
}
