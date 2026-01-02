import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  import.meta.env.VITE_FIREBASE_APP_ID
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: any = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  setPersistence(auth, browserLocalPersistence);
}

export { auth, db, googleProvider };

export const loginWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Firebase is not configured. Please set up Firebase credentials.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase popup sign-in error:", error);
    throw error;
  }
};

export const logout = () => {
  if (auth) return auth.signOut();
  return Promise.resolve();
};
