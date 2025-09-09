import * as admin from 'firebase-admin';

// This env var should be set in `apphosting.yaml` for production
// and in `.env.local` for local development.
// IMPORTANT: Ensure the value is a valid JSON string.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountString) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

const serviceAccount = serviceAccountString ? JSON.parse(serviceAccountString) : {};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error('Firebase Admin SDK initialization error', e);
  }
}

export default admin;
