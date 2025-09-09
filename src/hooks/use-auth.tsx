
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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createUserProfile, getUserById } from "@/services/userService.server";


async function getUserProfileClient(userId: string): Promise<AppUser | null> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as AppUser;
    }
    return null;
}

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
  profileLoading: false,
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [isGuest, setIsGuestState] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      const guestStatus = sessionStorage.getItem('isGuest');
      if (guestStatus === 'true' && !firebaseUser) {
        setIsGuestState(true);
      } else {
        setIsGuestState(false);
      }
      
      setLoading(false); // Auth state is now known, unblock UI

      if (firebaseUser) {
        setProfileLoading(true);
        sessionStorage.removeItem('isGuest');
        // Fetch profile in the background
        getUserById(firebaseUser.uid).then(profile => {
            if (profile) {
                setUserProfile(profile);
            } else {
                 // Profile doesn't exist, create it
                const username = firebaseUser.email?.split('@')[0].toLowerCase() || `user${Date.now()}`;
                const newProfileData = {
                    name: firebaseUser.displayName || "New User",
                    username: username,
                    email: firebaseUser.email!,
                };
                createUserProfile(firebaseUser.uid, newProfileData)
                    .then(() => getUserById(firebaseUser.uid))
                    .then(newProfile => setUserProfile(newProfile))
                    .catch(e => console.error("Failed to create/fetch user profile", e));
            }
        }).catch(e => {
            console.error("Error fetching user profile", e);
        }).finally(() => {
            setProfileLoading(false);
        });
      } else {
        setUserProfile(null);
      }
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
