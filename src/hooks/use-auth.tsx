
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
}>({
  user: null,
  loading: true,
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const pathIsProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const pathIsPublic = PUBLIC_ROUTES.includes(pathname);

    // If user is logged in and on a public-only page (login/signup), redirect to feed
    if (user && pathIsPublic) {
        router.replace('/feed');
        return;
    }

    // If user is not logged in and trying to access a protected page, redirect to home
    if (!user && pathIsProtected) {
      router.replace("/");
      return;
    }

  }, [user, loading, pathname, router]);

  const value = {
    user,
    loading,
  };

  // Render children only after initial auth check is complete, unless on a public page
  const canRenderChildren = !loading || PUBLIC_ROUTES.includes(pathname) || PROTECTED_ROUTES.some(r => pathname.startsWith(r) && !loading);


  return <AuthContext.Provider value={value}>{canRenderChildren ? children : null}</AuthContext.Provider>;
};
