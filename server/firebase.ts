import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Fallback to application default if env vars are missing
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export const adminDb = admin.firestore();
export const auth = admin.auth();
