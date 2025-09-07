
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
        storiesCollection, 
        where('status', '==', 'published'),
        where('timestamp', '>', twentyFourHoursAgo),
        orderBy('timestamp', 'desc')
    );
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
    
    // De-duplicate stories by user, keeping only the latest one
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
    contentUrl: string;
    duration: number;
    status: 'published' | 'processing';
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
