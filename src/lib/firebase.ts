
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "vibespace-h7vsa",
  "appId": "1:473324197014:web:880dfa2_Super_Secret_AppId",
  "storageBucket": "vibespace-h7vsa.appspot.com",
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

export { app, auth, db, storage };
