
'use client';

import { db } from '@/lib/firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc, 
    arrayUnion, 
    arrayRemove, 
    runTransaction, 
    startAt, 
    endAt, 
    orderBy, 
    setDoc 
} from 'firebase/firestore';
import type { User, Post } from '@/lib/types';
import { uploadFile } from './storageService';


export async function getUserById(userId: string): Promise<User | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user by ID (${userId}):`, error);
    return null;
  }
}

export async function searchUsers(searchText: string): Promise<User[]> {
    if (!searchText.trim()) {
        return [];
    }
    try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, 
            orderBy('username'),
            startAt(searchText.toLowerCase()),
            endAt(searchText.toLowerCase() + '\uf8ff')
        );
            
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
}

export async function updateUserSettings(userId: string, settings: Partial<Pick<User, 'isPrivate' | 'showActivityStatus'>>) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, settings);
    } catch (error) {
        console.error("Error updating user settings:", error);
        throw new Error("Failed to update user settings.");
    }
}

export async function updateUserProfile(userId: string, data: { name: string; bio: string; avatarFile?: File }) {
    const userRef = doc(db, 'users', userId);
    
    const updateData: { name: string; bio: string; avatar?: string } = {
        name: data.name,
        bio: data.bio,
    };
    
    if (data.avatarFile) {
        const avatarUrl = await uploadFile(data.avatarFile, `avatars/${userId}_${data.avatarFile.name}`);
        updateData.avatar = avatarUrl;
    }

    await updateDoc(userRef, updateData);
}
