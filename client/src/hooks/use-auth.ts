import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [loading, setLoading] = useState(auth ? !auth.currentUser : false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    console.log("useAuth: Setting up state listener");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("useAuth: State changed", firebaseUser?.email || "No user");
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
