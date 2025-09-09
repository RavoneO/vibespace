
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    // Explicitly providing the projectId can make initialization more robust in some environments.
    // The rest of the credentials will be picked up automatically from the environment.
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { firestore, auth as adminAuth, storage as adminStorage };
