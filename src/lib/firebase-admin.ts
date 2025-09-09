'use server';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { adminAuth, firestore, adminStorage };
