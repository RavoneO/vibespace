
'use server'

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { streamText } from 'ai';

export interface Ad {
    id: string;
    headline: string;
    description: string;
    imageUrl: string;
    keywords: string[];
}

const adInventory: Ad[] = [
    {
        id: 'ad-001',
        headline: 'Summit-Seeker Trail Boots',
        description: 'Conquer any peak with our all-weather, high-grip hiking boots.',
        imageUrl: 'https://picsum.photos/seed/ad1/400/400',
        keywords: ['hiking', 'outdoors', 'adventure', 'mountains', 'nature', 'footwear']
    },
    {
        id: 'ad-002',
        headline: 'Urban Explorer Backpack',
        description: 'Stylish, durable, and ready for your city adventures. Fits a 15" laptop.',
        imageUrl: 'https://picsum.photos/seed/ad2/400/400',
        keywords: ['city', 'travel', 'fashion', 'tech', 'backpack']
    },
    {
        id: 'ad-003',
        headline: 'Gourmet Barista Coffee Beans',
        description: 'Start your day with the perfect cup. Single-origin, ethically sourced beans.',
        imageUrl: 'https://picsum.photos/seed/ad3/400/400',
        keywords: ['coffee', 'food', 'morning', 'lifestyle', 'cafe']
    },
    {
        id: 'ad-004',
        headline: 'PetPal Automatic Feeder',
        description: 'Keep your furry friends happy and fed, even when you\'re away.',
        imageUrl: 'https://picsum.photos/seed/ad4/400/400',
        keywords: ['pets', 'dogs', 'cats', 'animals', 'tech', 'home']
    },
    {
        id: 'ad-005',
        headline: 'Zen Garden Yoga Mat',
        description: 'Find your flow with our extra-thick, non-slip yoga mat. Made from sustainable materials.',
        imageUrl: 'https://picsum.photos/seed/ad5/400/400',
        keywords: ['yoga', 'fitness', 'wellness', 'health', 'mindfulness', 'exercise']
    },
     {
        id: 'ad-006',
        headline: 'Cozy Corner Reading Lamp',
        description: 'The perfect light for your reading nook. Warm, adjustable, and stylish.',
        imageUrl: 'https://picsum.photos/seed/ad6/400/400',
        keywords: ['home', 'decor', 'books', 'reading', 'cozy', 'lifestyle']
    }
];

// --- Splash Ad Configuration ---
const splashAd: Ad = {
    id: 'ad-splash-001',
    headline: 'Vibespace Pro is Here!',
    description: 'Unlock exclusive features, remove ads, and get a special badge on your profile. Upgrade your vibe today!',
    imageUrl: 'https://picsum.photos/seed/splash1/800/800',
    keywords: ['pro', 'upgrade', 'premium']
};

// Set this to false to disable the splash ad
const isSplashAdActive = true; 
// -----------------------------


export async function getAvailableAds(): Promise<Ad[]> {
    // In a real scenario, this could involve complex logic to fetch ads based on user segments, budget, etc.
    return adInventory;
}

export async function getSplashAd(): Promise<Ad | null> {
    // This function returns the splash ad only if it's currently active.
    return isSplashAdActive ? splashAd : null;
}

const AdSelectionResponseSchema = z.object({
  adId: z.string().describe('The ID of the most suitable ad from the provided inventory. This ID must be one of the IDs from the available ads list.'),
  reason: z.string().describe('A brief explanation for why this ad was chosen.'),
});

const adSelectionPrompt = ai.definePrompt({
    name: 'adSelectionPrompt',
    input: { schema: z.object({ ads: z.array(z.any()), captions: z.array(z.string()) }) },
    output: { schema: AdSelectionResponseSchema },
    prompt: `You are an expert ad targeting system. Your task is to select the most relevant ad for a user based on the captions of their recent posts.

    Analyze the user's recent post captions to understand their interests. Then, review the available ad inventory and choose the single best ad that aligns with those interests.

    **Available Ad Inventory:**
    \`\`\`json
    {{{json ads}}}
    \`\`\`

    **User's Recent Post Captions:**
    - "{{#each captions}}{{{this}}}{{/each}}"

    Based on this information, select the best ad and provide a brief reason for your choice.
    `,
});

export async function selectAd(availableAds: Ad[], recentCaptions: string[]): Promise<Ad> {
    if (!availableAds.length) {
        throw new Error('No ads available to select from.');
    }
    try {
        const { output } = await adSelectionPrompt({ ads: availableAds, captions: recentCaptions });
        
        if (output) {
            const selectedAd = availableAds.find(ad => ad.id === output.adId);
            return selectedAd || availableAds[Math.floor(Math.random() * availableAds.length)];
        }
        
    } catch (error) {
        console.error("AI ad selection failed, falling back to random selection:", error);
    }
    
    // Fallback to random ad if AI fails or doesn't provide a valid response
    return availableAds[Math.floor(Math.random() * availableAds.length)];
}
