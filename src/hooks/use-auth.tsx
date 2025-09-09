
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
            let profile = await getUserById(user.uid);
            if (!profile) {
                const username = user.email?.split('@')[0].toLowerCase() || `user${Date.now()}`;
                const newProfileData = {
                    name: user.displayName || "New User",
                    username: username,
                    email: user.email!,
                };
                await createUserProfile(user.uid, newProfileData);
                profile = await getUserById(user.uid);
            }
            setUserProfile(profile);
        } catch (e) {
            console.error("Error fetching user profile", e);
            setUserProfile(null);
        } finally {
            setProfileLoading(false);
        }
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, [user]);
  
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
