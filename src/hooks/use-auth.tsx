
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import type { User as AppUser } from "@/lib/types";
import { getUserById } from "@/services/userService";

export const AuthContext = createContext<{
  userProfile: AppUser | null;
  loading: boolean;
  isGuest: boolean;
}>({
  userProfile: null,
  loading: true,
  isGuest: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);

  const loading = status === "loading";
  const isGuest = status === "unauthenticated";

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.email) {
        // Use email as the ID to fetch the full user profile from Firestore
        const profile = await getUserById(session.user.email);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };

    if (status === "authenticated") {
      fetchUserProfile();
    } else {
       setUserProfile(null);
    }
  }, [session, status]);


  const value = {
    userProfile,
    loading: loading || (status === 'authenticated' && !userProfile),
    isGuest,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};
