import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const formattedKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      });
      console.log("Firebase Admin initialized successfully with provided credentials.");
    } catch (error) {
      console.error("Firebase Admin initialization failed:", error);
      // Don't fall back if we have keys but they are wrong, it's better to fail clearly
      throw error;
    }
  } else {
    console.warn("Firebase credentials missing, attempting applicationDefault...");
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export const adminDb = admin.firestore();
export const auth = admin.auth();
