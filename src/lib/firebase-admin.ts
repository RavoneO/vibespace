
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { firestore, auth as adminAuth, storage as adminStorage };
