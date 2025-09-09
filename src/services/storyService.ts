
import { db } from '@/lib/firebase';
import { firestore as adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore';
import type { Story } from '@/lib/types';
import { getUserById } from './userService';

const isServer = typeof window === 'undefined';

// Function to get a user by ID
async function getFullUser(userId: string) {
    const user = await getUserById(userId);
    return user || { id: userId, name: "Unknown User", username: "unknown", avatar: "", bio: ""};
}

export async function getStories(): Promise<Story[]> {
  try {
    const dbInstance = isServer ? adminDb : db;
    const storiesCollection = dbInstance.collection('stories');
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
          throw new Error(`User not found for story ${doc.id}`);
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
        .filter(result => result.status === 'fulfilled')
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
        const docRef = await addDoc(collection(db, 'stories'), {
            ...storyData,
            contentUrl: '',
            timestamp: serverTimestamp(),
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
        const storyRef = doc(db, 'stories', storyId);
        await updateDoc(storyRef, data as any);
    } catch (error) {
        console.error("Error updating story:", error);
        throw new Error("Failed to update story.");
    }
}
