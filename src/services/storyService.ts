
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
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
