
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User as AppUser } from "@/lib/types";

export const AuthContext = createContext<{
  user: FirebaseUser | null;
  userProfile: AppUser | null;
  loading: boolean;
  isGuest: boolean;
  setAsGuest: () => void;
}>({
  user: null,
  userProfile: null,
  loading: true,
  isGuest: false,
  setAsGuest: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);

  useEffect(() => {
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const response = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: result.user.uid,
                displayName: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
            }),
          });
          if (!response.ok) throw new Error('Failed to create/update user profile');
          const profile = await response.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error processing redirect result", error);
      } 
    };

    processRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsGuestState(false);
        sessionStorage.removeItem('isGuest');
        if (!userProfile) { // Fetch profile only if not already set by redirect
          try {
            const response = await fetch(`/api/user?userId=${firebaseUser.uid}`);
            if (response.ok) {
              const profile = await response.json();
              setUserProfile(profile);
            }
          } catch (error) {
            console.error("Error fetching user profile", error);
          }
        }
      } else {
        const guestStatus = sessionStorage.getItem('isGuest');
        if (guestStatus === 'true') {
          setIsGuestState(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setAsGuest = useCallback(() => {
    sessionStorage.setItem('isGuest', 'true');
    setIsGuestState(true);
    setUser(null);
    setUserProfile(null);
    setLoading(false);
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isGuest,
    setAsGuest,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};
