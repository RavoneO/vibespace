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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        if (pathname !== "/login" && pathname !== "/signup") {
            router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
