
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Story } from '@/lib/types';
import { getUserById } from './userService';
import { users as mockUsers } from '@/lib/data'; // fallback

// Function to get a user by ID, with fallback to mock data
async function getFullUser(userId: string) {
    const user = await getUserById(userId);
    return user || mockUsers.find(u => u.id === userId) || mockUsers[0];
}

export async function getStories(): Promise<Story[]> {
  try {
    const storiesCollection = collection(db, 'stories');
    // To-do: Add a where clause to only fetch stories from the last 24 hours
    const q = query(storiesCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const stories: Story[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const user = await getFullUser(data.userId);
      
      return {
        id: doc.id,
        user,
        type: data.type,
        contentUrl: data.contentUrl,
        duration: data.duration,
        timestamp: data.timestamp,
        dataAiHint: data.dataAiHint,
      };
    }));
    
    return stories;
  } catch (error) {
    console.error("Error fetching stories:", error);
    // Return mock data as fallback
    return (await import('@/lib/data')).stories;
  }
}

export async function createStory(storyData: {
    userId: string;
    type: 'image' | 'video';
    contentUrl: string;
    duration: number;
}) {
    try {
        await addDoc(collection(db, 'stories'), {
            ...storyData,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating story:", error);
        throw new Error("Failed to create story.");
    }
}
