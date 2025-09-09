import admin from 'firebase-admin';

// IMPORTANT: Ensure the FIREBASE_SERVICE_ACCOUNT_KEY is set in your environment.
// For local development, you can create a .env.local file.
// For production, this should be a secure environment variable.

export default async function HomePage() {
  let message = "Firebase Admin SDK failed to initialize.";
  try {
    // The initialization is now handled in the imported module (src/lib/firebase-admin.ts)
    // We just need to check if it was successful by verifying the number of initialized apps.
    if (admin.apps.length > 0) {
        message = "Firebase Admin SDK initialized successfully!";
        console.log("✅ Firebase Admin SDK seems to be working.");
    } else {
        // This case might occur if the service account key is missing or invalid.
        console.error("🔥 Firebase Admin SDK was imported but no apps are initialized.");
    }
  } catch (error) {
    console.error("🔥 Firebase Admin SDK initialization error:", error);
    message = `Firebase Admin SDK initialization error: ${(error as Error).message}`;
  }

  return <h1>{message}</h1>;
}
