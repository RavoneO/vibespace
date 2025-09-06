
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Story } from '@/lib/types';
import { getUserById } from './userService';

// Function to get a user by ID
async function getFullUser(userId: string) {
    const user = await getUserById(userId);
    // If user not found, something is wrong with the data, but we shouldn't crash.
    // Return a default object or handle appropriately.
    return user || { id: userId, name: "Unknown User", username: "unknown", avatar: "", bio: ""};
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
      } as Story;
    }));
    
    return stories;
  } catch (error) {
    console.error("Error fetching stories:", error);
    return [];
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
