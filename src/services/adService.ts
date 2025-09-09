
"use client";

// This is a mock ad service. In a real application, this would fetch ads from a database or a third-party ad network.

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

export function getAvailableAds(): Ad[] {
    // In a real scenario, this could involve complex logic to fetch ads based on user segments, budget, etc.
    return adInventory;
}
