
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

export const AuthContext = createContext<{
  user: FirebaseUser | null;
  userProfile: AppUser | null;
  loading: boolean; // This will now represent authLoading
  profileLoading: boolean;
  isGuest: boolean;
  setAsGuest: () => void;
}>({
  user: null,
  userProfile: null,
  loading: true,
  profileLoading: true,
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
  const [profileLoading, setProfileLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // Auth state is now known, unblock UI immediately
      
      const guestStatus = sessionStorage.getItem('isGuest');
      if (guestStatus === 'true' && !firebaseUser) {
        setIsGuestState(true);
        setProfileLoading(false);
      } else {
        setIsGuestState(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setProfileLoading(true);
        sessionStorage.removeItem('isGuest');
        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            const profile = await response.json();
            setUserProfile(profile);
        } catch (e) {
            console.error("Error fetching user profile", e);
            setUserProfile(null);
        } finally {
            setProfileLoading(false);
        }
      } else {
        setUserProfile(null);
        if (!isGuest) {
            setProfileLoading(false);
        }
      }
    }
    fetchProfile();
  }, [user, isGuest]);
  
  const setAsGuest = useCallback(() => {
    sessionStorage.setItem('isGuest', 'true');
    setIsGuestState(true);
    setUser(null);
  }, []);


  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    isGuest,
    setAsGuest,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};
