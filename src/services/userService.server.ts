import { firestore as adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { analyzeContent } from '@/ai/flows/ai-content-analyzer';
import { uploadFile } from './storageService';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getUserById(userId: string): Promise<User | null> {
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
    try {
        const nameCheck = await analyzeContent({ text: data.name });
        if (!nameCheck.isAllowed) {
            throw new Error(nameCheck.reason || "The provided name is not allowed.");
        }

        const usernameCheck = await analyzeContent({ text: data.username });
        if (!usernameCheck.isAllowed) {
            throw new Error(usernameCheck.reason || "The provided username is not allowed.");
        }

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
    } catch (error: any) {
        console.error("Error creating user profile:", error);
        throw new Error(`Failed to create user profile: ${error.message}`);
    }
}

export async function updateUserProfile(userId: string, data: { name: string; bio: string; avatarFile?: File }) {
    try {
        const nameCheck = await analyzeContent({ text: data.name });
        if (!nameCheck.isAllowed) {
            throw new Error(nameCheck.reason || "The provided name is not allowed.");
        }
        
        if (data.bio) {
            const bioCheck = await analyzeContent({ text: data.bio });
            if (!bioCheck.isAllowed) {
                throw new Error(bioCheck.reason || "The provided bio is not allowed.");
            }
        }

        const userRef = adminDb.collection('users').doc(userId);
        const updateData: { name: string; bio: string; avatar?: string } = {
            name: data.name,
            bio: data.bio,
        };

        if (data.avatarFile) {
            const avatarUrl = await uploadFile(data.avatarFile, `avatars/${userId}_${Date.now()}`);
            updateData.avatar = avatarUrl;
        }

        await userRef.update(updateData);
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
}
