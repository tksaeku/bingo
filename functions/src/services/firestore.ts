import admin, { credential } from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Only initialize if not already initialized (to avoid duplicate app errors)
if (!admin.apps.length) {
  try {
    // 1) If GOOGLE_APPLICATION_CREDENTIALS is set, initialize with default (firebase-admin will pick it up)
    let credentialsJSON = null;
    const candidatePath = path.resolve(__dirname, '../../serviceAccountKey.json');
    if (fs.existsSync(candidatePath)) {
      console.log('Initializing Firebase Admin SDK with serviceAccountKey.json file');
      const raw = fs.readFileSync(candidatePath, 'utf8');
      credentialsJSON = JSON.parse(raw);
      admin.initializeApp({
        credential: admin.credential.cert(credentialsJSON),
        projectId: process.env.FIREBASE_PROJECT_ID || credentialsJSON.project_id,
      });
    } else {
      console.log('Initializing Firebase Admin SDK with application default credentials');
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK:', err);
    throw err;
  }
}

export const db = admin.firestore();

export function getCollection(name: string) {
  return db.collection(name);
}

export default admin;
