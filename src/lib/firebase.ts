import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC2q1r0FjV4Y0o5p1qG1m5yY3sJ9b3yK8E",
  authDomain: "vibespace-studio-pwa.firebaseapp.com",
  projectId: "vibespace-studio-pwa",
  storageBucket: "vibespace-studio-pwa.appspot.com",
  messagingSenderId: "1009893976102",
  appId: "1:1009893976102:web:3e6e8c715c0e1e3e5f2b8a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
