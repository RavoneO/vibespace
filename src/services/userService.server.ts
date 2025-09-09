
'use server';

import { db } from '@/lib/firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    setDoc 
} from 'firebase/firestore';
import type { User, Post } from '@/lib/types';


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

export async function getUserByUsername(username: string): Promise<User | null> {
    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('username', '==', username));
      const querySnapshot = await getDocs(q);
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
    const userRef = doc(db, 'users', userId);
    
    const existingUser = await getDoc(userRef);
    if(existingUser.exists()) {
        console.log(`Profile for user ${userId} already exists.`);
        return;
    }

    const usernameExists = await getUserByUsername(data.username);
    if (usernameExists) {
        throw new Error(`Username @${data.username} is already taken.`);
    }

    const nameForAvatar = data.name.split(' ').join('+');
    await setDoc(userRef, {
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
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection,
        where('status', '==', 'published'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

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
      const postsCollection = collection(db, 'posts');
      const q = query(postsCollection,
          where('likedBy', 'array-contains', userId),
          where('status', '==', 'published'),
          orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
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
            const postRef = doc(db, 'posts', id);
            const postDoc = await getDoc(postRef);
            if (!postDoc.exists() || postDoc.data().status !== 'published') return null;
            const data = postDoc.data();
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
