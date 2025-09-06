
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

const PROTECTED_ROUTES = ["/feed", "/create", "/reels/upload", "/settings", "/messages", "/profile"];
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

      const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

      if (!user && isProtectedRoute) {
        router.push("/");
      }

      if (user && isPublicRoute) {
        router.push("/feed");
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
