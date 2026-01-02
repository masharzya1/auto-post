import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";

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
    console.log("Sign-in successful:", result.user.email);
    
    // Explicitly store a flag in localStorage to help with persistence debugging
    localStorage.setItem("auth_provider", "google");
    localStorage.setItem("last_login", new Date().toISOString());
    
    return result.user;
  } catch (error: any) {
    console.error("Firebase popup sign-in error:", error.code, error.message);
    // Handle specific errors like blocked popups
    if (error.code === 'auth/popup-blocked') {
      alert("Please enable popups for this site to sign in.");
    } else {
      alert(`Sign-in failed: ${error.message}`);
    }
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("auth_provider");
  localStorage.removeItem("last_login");
  return auth.signOut();
};

export const handleAuthRedirect = () => Promise.resolve(null);
