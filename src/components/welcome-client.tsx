
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { SplashAd } from "@/components/splash-ad";
import type { Ad } from "@/services/adService.server";

export function WelcomeClient({ initialSplashAd }: { initialSplashAd: Ad | null }) {
    const router = useRouter();
    const { user, loading, isGuest, setAsGuest } = useAuth();
    const [isSplashAdOpen, setIsSplashAdOpen] = useState(false);

    useEffect(() => {
        if (initialSplashAd) {
            const hasSeenAd = sessionStorage.getItem('hasSeenSplashAd');
            if (!hasSeenAd) {
                setIsSplashAdOpen(true);
                sessionStorage.setItem('hasSeenSplashAd', 'true');
            }
        }
    }, [initialSplashAd]);

    const handleGuestLogin = () => {
        setAsGuest();
        router.push("/feed");
    };

    // If the user is a guest, redirect them to the feed immediately.
    useEffect(() => {
        if (isGuest) {
            router.push("/feed");
        }
    }, [isGuest, router]);

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
                    ) : user || isGuest ? (
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
                {!user && !loading && !isGuest && (
                    <Button variant="link" className="mt-4" onClick={handleGuestLogin}>
                        Continue as Guest
                    </Button>
                )}
            </div>
            {initialSplashAd && <SplashAd ad={initialSplashAd} isOpen={isSplashAdOpen} onClose={() => setIsSplashAdOpen(false)} />}
        </>
    );
}
