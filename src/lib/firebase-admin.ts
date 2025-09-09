
'use server';

import * as admin from 'firebase-admin';

let app: admin.app.App;

function getFirebaseAdmin() {
  if (!app) {
    if (!admin.apps.length) {
      app = admin.initializeApp();
    } else {
      app = admin.app();
    }
  }
  return app;
}

export function getFirestore() {
  return getFirebaseAdmin().firestore();
}

export function getAuth() {
  return getFirebaseAdmin().auth();
}

export function getStorage() {
  return getFirebaseAdmin().storage();
}

export const adminAuth = getAuth();
export const firestore = getFirestore();
export const adminStorage = getStorage();
