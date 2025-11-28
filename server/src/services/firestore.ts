import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize firebase-admin. Prefer GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT (base64 JSON).
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString());
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', err);
      throw err;
    }
  } else {
    // Will use application default credentials if available (GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp();
  }
}

export const db = admin.firestore();

export function getCollection(name: string) {
  return db.collection(name);
}

export default admin;
