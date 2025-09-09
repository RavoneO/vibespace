
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    // projectId, etc. will be picked up from the environment
    // when running in App Hosting.
  });
}

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { firestore, auth as adminAuth, storage as adminStorage };
