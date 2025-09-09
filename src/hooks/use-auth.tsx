
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { User as AppUser } from "@/lib/types";
import { getUserById, createUserProfile } from "@/services/userService";


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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let profile = await getUserById(firebaseUser.uid);
        if (!profile) {
          // If profile doesn't exist, create it.
          try {
            const username = firebaseUser.email?.split('@')[0].toLowerCase() || `user${Date.now()}`;
            const newProfileData = {
              name: firebaseUser.displayName || "New User",
              username: username,
              email: firebaseUser.email!,
            };
            await createUserProfile(firebaseUser.uid, newProfileData);
            profile = await getUserById(firebaseUser.uid);
          } catch (e) {
            console.error("Failed to create user profile on-the-fly", e);
            // Don't block login if profile creation fails, just log it
          }
        }
        setUserProfile(profile);
        setIsGuestState(false);
        sessionStorage.removeItem('isGuest');
      } else {
        const guestStatus = sessionStorage.getItem('isGuest');
        if (guestStatus === 'true') {
            setIsGuestState(true);
        } else {
            setIsGuestState(false);
        }
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const setAsGuest = useCallback(() => {
    sessionStorage.setItem('isGuest', 'true');
    setIsGuestState(true);
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
