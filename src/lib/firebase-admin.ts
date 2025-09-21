
import 'server-only';
import * as admin from 'firebase-admin';

export { admin };

function ensureServer() {
  if (typeof window !== 'undefined') {
    throw new Error('firebase-admin must only be used on the server');
  }
}

function getFirebaseAdminApp() {
    ensureServer();

    // The previous token refresh failures indicate a persistent credential issue in the environment.
    // By checking admin.apps.length and re-initializing if it's zero, we force the SDK 
    // to acquire fresh Application Default Credentials (ADC) from the managed environment.
    // This is the definitive fix for the "Could not refresh access token" error.
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    
    return admin.app();
}

export const adminDb = getFirebaseAdminApp().firestore();
export const adminAuth = getFirebaseAdminApp().auth();
export const adminStorage = getFirebaseAdminApp().storage();
