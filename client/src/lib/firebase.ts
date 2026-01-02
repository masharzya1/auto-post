import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Ensure session persistence
setPersistence(auth, browserLocalPersistence);

export const loginWithGoogle = () => signInWithRedirect(auth, googleProvider);
export const logout = () => auth.signOut();

export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user;
  } catch (error) {
    console.error("Firebase auth redirect error:", error);
    return null;
  }
};
