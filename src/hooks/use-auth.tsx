
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, User as FirebaseAuthUser, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { User, Ad } from "@/lib/types";
import { getUserById, createUserProfile } from "@/services/userService";
import { getSplashAd } from "@/services/adService";
import { SplashAd } from "@/components/splash-ad";
import { useSession } from "next-auth/react";

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
const PUBLIC_ROUTES = ["/"];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: session, status } = useSession();
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
  }, []);

  useEffect(() => {
    const handleAuth = async () => {
      if (status === "authenticated" && session) {
        // NextAuth session exists, now we link with Firebase
        try {
          // This is a placeholder for a function that gets a custom token from your backend
          // You would need to create an API route for this
          // const response = await fetch('/api/firebase/custom-token');
          // const { token } = await response.json();
          // await signInWithCustomToken(auth, token);
          
          // For now, we will simulate user profile creation/fetching
          let profile = await getUserById(session.user.email!); // Using email as a temporary ID
          
          if (!profile) {
            await createUserProfile(session.user.email!, {
              name: session.user.name!,
              username: session.user.email!.split('@')[0],
              email: session.user.email!
            });
            profile = await getUserById(session.user.email!);
          }
          setUserProfile(profile);

        } catch (error) {
          console.error("Firebase custom auth failed:", error);
        }
      } else if (status === "unauthenticated") {
        // No NextAuth session, check for Firebase session or guest status
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const profile = await getUserById(fbUser.uid);
            setUserProfile(profile);
            setUser(fbUser);
          } else {
            setUserProfile(null);
            setUser(null);
          }
        });
        return () => unsubscribe();
      }
    };
    
    handleAuth();
    
    if (status !== 'loading') {
        setLoading(false);
    }
  }, [session, status]);
  
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
    
    if (status === "unauthenticated" && !isGuest && pathIsProtected) {
      router.replace("/");
      return;
    }

  }, [status, isGuest, loading, pathname, router]);

  const value = {
    user,
    userProfile,
    loading: status === "loading" || loading,
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
