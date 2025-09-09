
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { User, Ad } from "@/lib/types";
import { getUserById } from "@/services/userService";
import { getSplashAd } from "@/services/adService";
import { SplashAd } from "@/components/splash-ad";

export const AuthContext = createContext<{
  user: FirebaseAuthUser | null;
  userProfile: User | null;
  loading: boolean;
  isGuest: boolean;
  setAsGuest: (isGuest: boolean) => void;
  showSplashAd: () => void;
}>({
  user: null,
  userProfile: null,
  loading: true,
  isGuest: false,
  setAsGuest: () => {},
  showSplashAd: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

const PROTECTED_ROUTES = ["/feed", "/create", "/reels", "/settings", "/messages", "/profile", "/activity", "/search"];
const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [splashAd, setSplashAd] = useState<Ad | null>(null);
  const [isSplashAdOpen, setIsSplashAdOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const guestStatus = sessionStorage.getItem("isGuest") === "true";
    setIsGuest(guestStatus);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        sessionStorage.removeItem("isGuest");
        setIsGuest(false);
        const profile = await getUserById(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
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
  
  const showSplashAd = () => {
    const ad = getSplashAd();
    if (ad && sessionStorage.getItem("splashAdShown") !== "true") {
      setSplashAd(ad);
      setIsSplashAdOpen(true);
      sessionStorage.setItem("splashAdShown", "true");
    }
  };

  const closeSplashAd = () => {
    setIsSplashAdOpen(false);
  };

  useEffect(() => {
    if (loading) return;

    const pathIsProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    if (!user && !isGuest && pathIsProtected) {
      router.replace("/");
      return;
    }

  }, [user, isGuest, loading, pathname, router]);

  const value = {
    user,
    userProfile,
    loading,
    isGuest,
    setAsGuest,
    showSplashAd,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
        {splashAd && <SplashAd ad={splashAd} isOpen={isSplashAdOpen} onClose={closeSplashAd} />}
      </AuthContext.Provider>
  );
};
