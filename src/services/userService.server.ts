
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

export async function getPostsByUserId(userId: string): Promise<Post[]> {
  try {
    const postsCollection = adminDb.collection('posts');
    const q = postsCollection
        .where('status', '==', 'published')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc');
    const querySnapshot = await q.get();

    const posts: Post[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const user = await getUserById(data.userId); 
        return {
            id: doc.id,
            ...data,
            user,
        } as Post;
    }));

    return posts.filter(p => p.user);
  } catch (error) {
    console.error("Error fetching posts by user ID:", error);
    return [];
  }
}

export async function getLikedPostsByUserId(userId: string): Promise<Post[]> {
    try {
      const postsCollection = adminDb.collection('posts');
      const q = postsCollection
          .where('likedBy', 'array-contains', userId)
          .where('status', '==', 'published')
          .orderBy('timestamp', 'desc');
      const querySnapshot = await q.get();
      const posts: Post[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const user = await getUserById(data.userId);
        return {
            id: doc.id,
            ...data,
            user,
        } as Post;
    }));
      return posts.filter(p => p.user);
    } catch (error) {
      console.error("Error fetching liked posts by user ID:", error);
      return [];
    }
  }
  
export async function getSavedPosts(postIds: string[]): Promise<Post[]> {
    if (!postIds || postIds.length === 0) {
        return [];
    }
    try {
        const postPromises = postIds.map(async id => {
            const postRef = adminDb.collection('posts').doc(id);
            const postDoc = await postRef.get();
            if (!postDoc.exists || postDoc.data()?.status !== 'published') return null;
            const data = postDoc.data();
            if(!data) return null;
            const user = await getUserById(data.userId);
            return user ? { id: postDoc.id, ...data, user } as Post : null;
        });
        const posts = await Promise.all(postPromises);
        return posts.filter((p): p is Post => p !== null);
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        return [];
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
