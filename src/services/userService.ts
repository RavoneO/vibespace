
'use client';

import { db } from '@/lib/firebase';
import { getBlockedUsers as getBlockedUsersServer, unblockUser as unblockUserServer, getUserInterests as getUserInterestsServer } from './userService.server';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc,
    startAt, 
    endAt, 
    orderBy, 
} from 'firebase/firestore';
import type { User } from '@/lib/types';
import { uploadFile } from './storageService';


export async function getUserById(userId: string): Promise<User | null> {
  if (!userId) return null;
  try {
    // This now uses the client SDK, which means it will only work for rules that allow it.
    // For server-auth tasks, use API routes that call userService.server.
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

export async function getBlockedUsers(userId: string): Promise<User[]> {
    try {
        return await getBlockedUsersServer(userId);
    } catch (error) {
        console.error('Failed to get blocked users:', error);
        throw new Error('Could not get blocked users.');
    }
}

export async function unblockUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
        await unblockUserServer(currentUserId, targetUserId);
    } catch (error) {
        console.error('Failed to unblock user:', error);
        throw new Error('Could not unblock user.');
    }
}

export async function getUserInterests(userId: string): Promise<string[]> {
    try {
        return await getUserInterestsServer(userId);
    } catch (error) {
        console.error('Failed to get user interests:', error);
        throw new Error('Could not get user interests.');
    }
}

// Client-side toggle follow, calls our API route
export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId }),
    });

    if (!response.ok) {
        throw new Error('Failed to toggle follow');
    }

    const { isFollowing } = await response.json();
    return isFollowing;
}
