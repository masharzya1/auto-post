import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, onAuthStateChanged, type Auth } from "firebase/auth";

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
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  setPersistence(auth, browserLocalPersistence);
}

export { auth, googleProvider };

export const loginWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Firebase is not configured. Please set up Firebase credentials.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign-in successful:", result.user.email);
    
    localStorage.setItem("auth_provider", "google");
    localStorage.setItem("last_login", new Date().toISOString());
    
    return result.user;
  } catch (error: any) {
    console.error("Firebase popup sign-in error:", error.code, error.message);
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
  if (auth) {
    return auth.signOut();
  }
  return Promise.resolve();
};

export const handleAuthRedirect = () => Promise.resolve(null);
