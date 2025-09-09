
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { SplashAd } from "@/components/splash-ad";
import { getSplashAd } from "@/services/adService";
import { useState, useEffect }from "react";
import type { Ad } from "@/services/adService";


export default function WelcomePage() {
    const { user, loading, profileLoading, isGuest, setAsGuest } = useAuth();
    const [isSplashAdOpen, setIsSplashAdOpen] = useState(false);
    const [splashAd, setSplashAd] = useState<Ad | null>(null);

    useEffect(() => {
        async function fetchSplashAd() {
            const ad = await getSplashAd();
            if (ad) {
                setSplashAd(ad);
                const hasSeenAd = sessionStorage.getItem('hasSeenSplashAd');
                if (!hasSeenAd) {
                    setIsSplashAdOpen(true);
                    sessionStorage.setItem('hasSeenSplashAd', 'true');
                }
            }
        }
        fetchSplashAd();
    }, []);

    const handleGuestLogin = () => {
        setAsGuest();
    };

    return (
        <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <div className="mb-8">
                <div className="inline-block p-4 rounded-full bg-primary/10">
                    <Icons.sparkles className="h-12 w-12 text-primary" />
                </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground/90">
                Welcome to Vibespace
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                The modern social content sharing app. Discover, create, and connect.
                Share your vibe with the world.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                 {loading ? (
                    <Button size="lg" disabled>
                        <Icons.spinner className="animate-spin mr-2" />
                        Loading...
                    </Button>
                ) : user ? (
                    <Button asChild size="lg">
                        <Link href="/feed">Go to Your Feed</Link>
                    </Button>
                ) : (
                    <>
                        <Button asChild size="lg">
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </>
                )}
            </div>
            {!user && !loading && (
                 <Button variant="link" className="mt-4" onClick={handleGuestLogin}>
                    Continue as Guest
                </Button>
            )}
        </div>
        {splashAd && <SplashAd ad={splashAd} isOpen={isSplashAdOpen} onClose={() => setIsSplashAdOpen(false)} />}
        </>
    );
}
