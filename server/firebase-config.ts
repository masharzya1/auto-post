import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      const formattedKey = privateKey.includes("\\n") 
        ? privateKey.replace(/\\n/g, '\n') 
        : privateKey;

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
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export const adminDb = admin.firestore();
export const auth = admin.auth();
