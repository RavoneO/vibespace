
'use server';

import { selectAd as selectAdFlow } from '@/ai/flows/ai-ad-selector';
import type { Ad } from './adService';
import { getAvailableAds as getAvailableAdsClient } from './adService';

export function getAvailableAds(): Ad[] {
    return getAvailableAdsClient();
}

export async function selectAd(availableAds: Ad[], recentCaptions: string[]): Promise<Ad> {
    try {
        const ad = await selectAdFlow({ availableAds, recentCaptions });
        return ad;
    } catch (e) {
        console.error("AI ad selection failed, falling back to random.", e);
        return availableAds[Math.floor(Math.random() * availableAds.length)];
    }
}
