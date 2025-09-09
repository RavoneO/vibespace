
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { User } from '@/lib/types';
import { createActivity } from './activityService.server';
import { getPostById } from './postService.server';


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

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const postRef = adminDb.collection('posts').doc(postId);

  let isLiked = false;
  
  await adminDb.runTransaction(async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists) {
      throw new Error("Post does not exist!");
    }
    
    const postData = postDoc.data();
    if (!postData) throw new Error("Post data not found");
    const likedBy: string[] = postData.likedBy || [];
    
    if (likedBy.includes(userId)) {
      // Unlike
      transaction.update(postRef, { 
        likedBy: FieldValue.arrayRemove(userId),
        likes: FieldValue.increment(-1),
      });
      isLiked = false;
    } else {
      // Like
      transaction.update(postRef, { 
        likedBy: FieldValue.arrayUnion(userId),
        likes: FieldValue.increment(1),
      });
      isLiked = true;
    }
  });

  // Create activity notification outside the transaction
  if (isLiked) {
      const post = await getPostById(postId);
      if (post && post.user.id !== userId) {
        await createActivity({
            type: 'like',
            actorId: userId,
            notifiedUserId: post.user.id,
            postId: postId,
        });
      }
  }

  return isLiked;
}
