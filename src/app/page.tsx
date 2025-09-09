
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { SplashAd } from "@/components/splash-ad";
import { getSplashAd } from "@/services/adService.server";
import { WelcomeClient } from "@/components/welcome-client";
import type { Ad } from "@/services/adService.server";


export default async function WelcomePage() {
    const splashAd = await getSplashAd();

    return (
        <WelcomeClient initialSplashAd={splashAd} />
    );
}
