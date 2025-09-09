
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
