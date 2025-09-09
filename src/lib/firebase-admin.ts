import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Use applicationDefault to explicitly use the credentials provided by the App Hosting environment.
  // This is the most robust way to initialize in a managed Google Cloud environment.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { firestore, auth as adminAuth, storage as adminStorage };
