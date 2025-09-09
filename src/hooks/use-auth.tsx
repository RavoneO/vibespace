
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


async function getUserProfile(userId: string): Promise<AppUser | null> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as AppUser;
    }
    return null;
}

async function createUserProfileClient(userId: string, data: { name: string; username: string; email: string; }) {
    const userRef = doc(db, 'users', userId);
    
    const nameForAvatar = data.name.split(' ').join('+');
    await setDoc(userRef, {
        name: data.name,
        username: data.username.toLowerCase(),
        email: data.email,
        avatar: `https://ui-avatars.com/api/?name=${nameForAvatar}&background=random`,
        bio: "Welcome to Vibespace!",
        followers: [],
        following: [],
        savedPosts: [],
        isPrivate: false,
        showActivityStatus: true,
    });
}


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
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          try {
            const username = firebaseUser.email?.split('@')[0].toLowerCase() || `user${Date.now()}`;
            const newProfileData = {
              name: firebaseUser.displayName || "New User",
              username: username,
              email: firebaseUser.email!,
            };
            await createUserProfileClient(firebaseUser.uid, newProfileData);
            profile = await getUserProfile(firebaseUser.uid);
          } catch (e) {
            console.error("Failed to create user profile on-the-fly", e);
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
