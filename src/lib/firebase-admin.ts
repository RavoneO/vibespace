import 'server-only';
import * as admin from 'firebase-admin';

// Defensive, lazy loader for firebase-admin — safe if accidentally imported in client code.

function ensureServer() {
  if (typeof window !== 'undefined') {
    // If this happens, a client import exists somewhere — we'll log stack to help find it.
    // DON'T silence it in prod; we want to fail fast while debugging.
    const stack = new Error('firebase-admin imported from client').stack;
    // eslint-disable-next-line no-console
    console.error('🔥 firebase-admin loaded on client! Import chain (stack):\n', stack);
    throw new Error('firebase-admin must only be used on the server');
  }
}

let cachedApp: admin.app.App | null = null;

function getFirebaseAdminApp() {
    ensureServer();
    if (cachedApp) {
        return cachedApp;
    }

    if (admin.apps.length > 0) {
        cachedApp = admin.app();
        return cachedApp;
    }

    const keyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!keyRaw) {
        throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY is missing. Set it in the server environment (do NOT prefix NEXT_PUBLIC_)'
        );
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(keyRaw);
    } catch (err: any) {
        throw new Error(
        `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON: ${err.message}. ` +
        `If your key contains newlines, consider base64-encoding it and decode on the server.`
        );
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    cachedApp = admin.app();
    return cachedApp;
}


export const adminDb = getFirebaseAdminApp().firestore();
export const adminAuth = getFirebaseAdminApp().auth();
export const adminStorage = getFirebaseAdminApp().storage();