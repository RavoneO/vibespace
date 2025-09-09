
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { User, Post } from '@/lib/types';
import { createActivity } from './activityService';


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

export async function createUserProfile(userId: string, data: { name: string; username: string; email: string; }) {
    const userRef = adminDb.collection('users').doc(userId);
    
    const existingUser = await userRef.get();
    if(existingUser.exists) {
        console.log(`Profile for user ${userId} already exists.`);
        return;
    }

    const usernameExists = await getUserByUsername(data.username);
    if (usernameExists) {
        throw new Error(`Username @${data.username} is already taken.`);
    }

    const nameForAvatar = data.name.split(' ').join('+');
    await userRef.set({
        name: data.name,
        username: data.username.toLowerCase(),
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

export async function toggleBookmark(userId: string, postId: string): Promise<boolean> {
    const userRef = adminDb.collection('users').doc(userId);
    try {
        let isBookmarked = false;
        await adminDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User not found");
            }
            const data = userDoc.data();
            if (!data) throw new Error("User data not found");

            const savedPosts = data.savedPosts || [];
            if (savedPosts.includes(postId)) {
                // Un-bookmark
                transaction.update(userRef, { savedPosts: FieldValue.arrayRemove(postId) });
                isBookmarked = false;
            } else {
                // Bookmark
                transaction.update(userRef, { savedPosts: FieldValue.arrayUnion(postId) });
                isBookmarked = true;
            }
        });
        return isBookmarked;
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        throw new Error("Failed to toggle bookmark status.");
    }
}

