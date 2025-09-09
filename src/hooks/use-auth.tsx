
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import type { User as AppUser } from "@/lib/types";
import { getUserById } from "@/services/userService";

export const AuthContext = createContext<{
  userProfile: AppUser | null;
  loading: boolean;
  isGuest: boolean;
  setAsGuest: () => void;
}>({
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
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [isGuest, setIsGuestState] = useState(true);

  const loading = status === "loading";

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.email) {
        // Use email as the ID to fetch the full user profile from Firestore
        const profile = await getUserById(session.user.email);
        setUserProfile(profile);
        setIsGuestState(false);
      } else {
        setUserProfile(null);
      }
    };

    if (status === "authenticated") {
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
       const guestStatus = sessionStorage.getItem('isGuest');
       if (guestStatus === 'true') {
           setIsGuestState(true);
       } else {
           // If not explicitly a guest, and not logged in, we can treat as non-guest waiting for login
           setIsGuestState(false);
       }
       setUserProfile(null);
    }
  }, [session, status]);
  
  const setAsGuest = useCallback(() => {
    sessionStorage.setItem('isGuest', 'true');
    setIsGuestState(true);
  }, []);


  const value = {
    userProfile,
    loading: loading || (status === 'authenticated' && !userProfile),
    isGuest,
    setAsGuest,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};
