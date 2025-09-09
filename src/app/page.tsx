
import { getSplashAd } from "@/services/adService.server";
import { WelcomeClient } from "@/components/welcome-client";
import type { Ad } from "@/services/adService.server";


export default async function WelcomePage() {
    const splashAd = await getSplashAd();

    return (
        <WelcomeClient initialSplashAd={splashAd} />
    );
}
