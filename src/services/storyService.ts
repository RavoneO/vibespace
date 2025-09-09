
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import type { Story } from '@/lib/types';

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
