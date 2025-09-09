
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove, runTransaction, startAt, endAt, orderBy, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { uploadFile } from './storageService';
import { createActivity } from './activityService';
import { analyzeContent } from '@/ai/flows/ai-content-analyzer';
import { searchUsers as searchUsersServer } from './userService.server';

export async function getUserById(userId: string): Promise<User | null> {
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

        const userRef = doc(db, 'users', userId);
        const nameForAvatar = data.name.split(' ').join('+');
        await setDoc(userRef, {
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

export async function searchUsers(searchText: string): Promise<User[]> {
    // This now delegates to the server-only function for consistency,
    // though it could be a client-side implementation if desired.
    return searchUsersServer(searchText);
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
                
                await createActivity({
                    type: 'follow',
                    actorId: currentUserId,
                    notifiedUserId: targetUserId
                });
            }
        });
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

        const userRef = doc(db, 'users', userId);
        const updateData: { name: string; bio: string; avatar?: string } = {
            name: data.name,
            bio: data.bio,
        };

        if (data.avatarFile) {
            const avatarUrl = await uploadFile(data.avatarFile, `avatars/${userId}_${Date.now()}`);
            updateData.avatar = avatarUrl;
        }

        await updateDoc(userRef, updateData);
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
}
