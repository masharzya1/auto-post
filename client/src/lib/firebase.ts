import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";

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

// Standardize Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Ensure session persistence
setPersistence(auth, browserLocalPersistence);

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase popup sign-in error:", error);
    // Handle common errors
    if (error.code === 'auth/popup-blocked') {
      alert("Please enable popups to sign in with Google.");
    } else if (error.code === 'auth/cancelled-popup-request') {
      // User closed the popup, no action needed
    } else {
      alert(`Sign-in error: ${error.message}`);
    }
    throw error;
  }
};

export const logout = () => auth.signOut();

export const handleAuthRedirect = () => Promise.resolve(null);
