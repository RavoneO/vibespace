
import 'server-only';
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in the environment variables.');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
