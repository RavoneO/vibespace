
'use server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Story, User } from '@/lib/types';
import { getUserById } from './userService.server';


async function getFullUser(userId: string): Promise<User | null> {
    const user = await getUserById(userId);
    return user;
}

export async function getStories(): Promise<Story[]> {
  try {
    const storiesCollection = adminDb.collection('stories');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = storiesCollection
        .where('status', '==', 'published')
        .where('timestamp', '>', twentyFourHoursAgo)
        .orderBy('timestamp', 'desc');
    
    const querySnapshot = await q.get();
    
    const results = await Promise.allSettled(querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const user = await getFullUser(data.userId);
      
      if (!user) {
          console.warn(`User not found for story ${doc.id}, skipping story.`);
          return null;
      }

      return {
        id: doc.id,
        user,
        type: data.type,
        contentUrl: data.contentUrl,
        duration: data.duration,
        timestamp: data.timestamp,
        dataAiHint: data.dataAiHint,
      } as Story;
    }));

    const stories = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<Story>).value);
    
    const latestStories: { [userId: string]: Story } = {};
    stories.forEach(story => {
        if (!latestStories[story.user.id]) {
            latestStories[story.user.id] = story;
        }
    });
    
    return Object.values(latestStories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return [];
  }
}

export async function createStory(storyData: {
    userId: string;
    type: 'image' | 'video';
    duration: number;
}): Promise<string> {
    try {
        const docRef = await adminDb.collection('stories').add({
            ...storyData,
            contentUrl: '',
            timestamp: FieldValue.serverTimestamp(),
            status: 'processing',
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating story:", error);
        throw new Error("Failed to create story.");
    }
}

export async function updateStory(storyId: string, data: Partial<Story>) {
    try {
        const storyRef = adminDb.collection('stories').doc(storyId);
        await storyRef.update(data as any);
    } catch (error) {
        console.error("Error updating story:", error);
        throw new Error("Failed to update story.");
    }
}
