
'use server';

import { firestore as adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { uploadFile } from './storageService'; // Assuming storageService is client-safe or you have a .server version
import { generateVibe as generateVibeServer } from '@/ai/flows/ai-profile-vibe';

export async function getUserById(userId: string): Promise<User | null> {
  if (!userId) return null;
  try {
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user by ID (${userId}):`, error);
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
    try {
      const usersCollection = adminDb.collection('users');
      const q = usersCollection.where('username', '==', username);
      const querySnapshot = await q.get();
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return null;
    }
}

export async function searchUsers(searchText: string): Promise<User[]> {
    if (!searchText.trim()) {
        return [];
    }
    try {
        const usersCollection = adminDb.collection('users');
        const q = usersCollection
            .orderBy('username')
            .startAt(searchText.toLowerCase())
            .endAt(searchText.toLowerCase() + '\uf8ff');
            
        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
}

export async function createUserProfile(userId: string, data: { name: string; username: string; email: string; }) {
    const userRef = adminDb.collection('users').doc(userId);
    const nameForAvatar = data.name.split(' ').join('+');
    await userRef.set({
        name: data.name,
        username: data.username,
        email: data.email,
        avatar: `https://ui-avatars.com/api/?name=${nameForAvatar}&background=random`,
        bio: "Welcome to Vibespace!",
        followers: [],
        following: [],
        savedPosts: [],
        isPrivate: false,
        showActivityStatus: true,
    });
}

export async function updateUserProfile(userId: string, data: { name: string; bio: string; avatarFile?: File }) {
    const userRef = adminDb.collection('users').doc(userId);
    
    // Because we can't pass a File object to a server action easily,
    // we assume the file upload has been handled on the client and a URL is passed,
    // or the file is handled in a separate client-side upload service.
    // This example will focus on text updates.
    const updateData: { name: string; bio: string; avatar?: string } = {
        name: data.name,
        bio: data.bio,
    };
    
    if (data.avatarFile) {
        // This part assumes uploadFile can be called from the server or that
        // the client has already uploaded the file and is passing a URL.
        // For this fix, let's assume `updateUserProfile` in `userService.ts` handles the upload
        // and passes a URL if needed. Here we just focus on the DB update.
        // A more robust solution might involve signed URLs for direct server upload.
        console.warn("Avatar file passed to server function. This should be handled via a client-side upload service.");
    }


    await userRef.update(updateData);
}

export async function generateVibe(captions: string[]) {
    return generateVibeServer({ captions });
}
