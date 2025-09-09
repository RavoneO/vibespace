
"use client";

import {
  ReactNode,
  createContext,
  useContext,
} from "react";
import { useSession, SessionProvider } from "next-auth/react";
import type { User as AppUser } from "@/lib/types"; // Renaming to avoid conflict with NextAuth's User type

export const AuthContext = createContext<{
  userProfile: AppUser | null; // This can be expanded later to sync with a DB profile
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


// This is a slimmed down AuthProvider. 
// It bridges the NextAuth session with our app's context.
// In a real app, this is where you might fetch your app-specific user profile
// based on the NextAuth session's user email or ID.
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const isGuest = status === "unauthenticated";

  // This is a placeholder for a more detailed user profile from your database.
  // For now, we'll map the session user to our AppUser type.
  const userProfile: AppUser | null = session ? {
      id: session.user.email!, // Using email as a unique ID for now
      email: session.user.email!,
      name: session.user.name!,
      username: session.user.email!.split('@')[0],
      avatar: session.user.image!,
      bio: "Vibespace user",
  } : null;

  const value = {
    userProfile,
    loading,
    isGuest,
    // Deprecated functions removed for clarity
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};

    