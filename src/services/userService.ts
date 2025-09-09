
'use client';

import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
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
import { FieldValue } from 'firebase-admin/firestore';
import type { User, Post } from '@/lib/types';
import { uploadFile } from './storageService';
import { createActivity } from './activityService';


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


export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (currentUserId === targetUserId) {
        throw new Error("You cannot follow yourself.");
    }

    const currentUserRef = adminDb.collection('users').doc(currentUserId);
    const targetUserRef = adminDb.collection('users').doc(targetUserId);

    try {
        let isFollowing = false;
        await adminDb.runTransaction(async (transaction) => {
            const currentUserDoc = await transaction.get(currentUserRef);
            
            if (!currentUserDoc.exists) {
                throw new Error("Current user does not exist!");
            }

            const currentUserData = currentUserDoc.data();
            if (!currentUserData) throw new Error("Current user data not found");
            
            const following = currentUserData.following || [];
            
            if (following.includes(targetUserId)) {
                // Unfollow
                transaction.update(currentUserRef, { following: FieldValue.arrayRemove(targetUserId) });
                transaction.update(targetUserRef, { followers: FieldValue.arrayRemove(currentUserId) });
                isFollowing = false;
            } else {
                // Follow
                transaction.update(currentUserRef, { following: FieldValue.arrayUnion(targetUserId) });
                transaction.update(targetUserRef, { followers: FieldValue.arrayUnion(currentUserId) });
                isFollowing = true;
            }
        });

        if (isFollowing) {
           await createActivity({ type: 'follow', actorId: currentUserId, notifiedUserId: targetUserId });
        }

        return isFollowing;
    } catch (error) {
        console.error("Error toggling follow:", error);
        throw new Error("Failed to toggle follow status.");
    }
}

export async function updateUserSettings(userId: string, settings: Partial<Pick<User, 'isPrivate' | 'showActivityStatus'>>) {
    try {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update(settings);
    } catch (error) {
        console.error("Error updating user settings:", error);
        throw new Error("Failed to update user settings.");
    }
}

export async function updateUserProfile(userId: string, data: { name: string; bio: string; avatarFile?: File }) {
    const userRef = adminDb.collection('users').doc(userId);
    
    const updateData: { name: string; bio: string; avatar?: string } = {
        name: data.name,
        bio: data.bio,
    };
    
    if (data.avatarFile) {
        const avatarUrl = await uploadFile(data.avatarFile, `avatars/${userId}_${data.avatarFile.name}`);
        updateData.avatar = avatarUrl;
    }

    await userRef.update(updateData);
}
