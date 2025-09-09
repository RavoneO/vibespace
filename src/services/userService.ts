
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
        const user = await getUserById(data.userId); // This is safe now
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
            return user ? { id: doc.id, ...data, user } as Post : null;
        });
        const posts = await Promise.all(postPromises);
        return posts.filter((p): p is Post => p !== null);
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        return [];
    }
}


export async function toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (currentUserId === targetUserId) {
        throw new Error("You cannot follow yourself.");
    }

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    try {
        let isFollowing = false;
        await runTransaction(db, async (transaction) => {
            const currentUserDoc = await transaction.get(currentUserRef);
            
            if (!currentUserDoc.exists()) {
                throw new Error("Current user does not exist!");
            }

            const currentUserData = currentUserDoc.data();
            const following = currentUserData.following || [];
            
            if (following.includes(targetUserId)) {
                // Unfollow
                transaction.update(currentUserRef, { following: arrayRemove(targetUserId) });
                transaction.update(targetUserRef, { followers: arrayRemove(currentUserId) });
                isFollowing = false;
            } else {
                // Follow
                transaction.update(currentUserRef, { following: arrayUnion(targetUserId) });
                transaction.update(targetUserRef, { followers: arrayUnion(currentUserId) });
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

export async function toggleBookmark(userId: string, postId: string): Promise<boolean> {
    const userRef = doc(db, 'users', userId);
    try {
        let isBookmarked = false;
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found");
            }
            const savedPosts = userDoc.data().savedPosts || [];
            if (savedPosts.includes(postId)) {
                // Un-bookmark
                transaction.update(userRef, { savedPosts: arrayRemove(postId) });
                isBookmarked = false;
            } else {
                // Bookmark
                transaction.update(userRef, { savedPosts: arrayUnion(postId) });
                isBookmarked = true;
            }
        });
        return isBookmarked;
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        throw new Error("Failed to toggle bookmark status.");
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
