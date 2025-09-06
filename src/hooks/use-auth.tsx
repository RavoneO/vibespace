
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  setAsGuest: (isGuest: boolean) => void;
}>({
  user: null,
  loading: true,
  isGuest: false,
  setAsGuest: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

const PROTECTED_ROUTES = ["/feed", "/create", "/reels", "/settings", "/messages", "/profile", "/search"];
const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const guestStatus = sessionStorage.getItem("isGuest") === "true";
    setIsGuest(guestStatus);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        sessionStorage.removeItem("isGuest");
        setIsGuest(false);
      }
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const setAsGuest = (isGuest: boolean) => {
    if (isGuest) {
        sessionStorage.setItem("isGuest", "true");
    } else {
        sessionStorage.removeItem("isGuest");
    }
    setIsGuest(isGuest);
  }

  useEffect(() => {
    if (loading) return;

    const pathIsProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    // If user is not logged in, not a guest, and trying to access a protected page, redirect to home
    if (!user && !isGuest && pathIsProtected) {
      router.replace("/");
      return;
    }

  }, [user, isGuest, loading, pathname, router]);

  const value = {
    user,
    loading,
    isGuest,
    setAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
