
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "vibespace-h7vsa",
  "appId": "1:473324197014:web:880dfa2_Super_Secret_AppId",
  "storageBucket": "vibespace-h7vsa.firebasestorage.app",
  "apiKey": "AIzaSyB7n06b7mDNbBwhMkrVLIcYRuyFgRyH5jk",
  "authDomain": "vibespace-h7vsa.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "473324197014"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// NOTE: The emulator connections have been removed for production.
// If you want to connect to the emulators for local development,
// you can uncomment the following lines.
// try {
//   connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
//   connectFirestoreEmulator(db, "127.0.0.1", 8080);
//   connectStorageEmulator(storage, "127.0.0.1", 9199);
// } catch (e) {
//     console.error('Error connecting to emulators. This is expected in production.', e);
// }


export { app, auth, db, storage };
