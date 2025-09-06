
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import type { User } from '@/lib/types';

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
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
        return isFollowing;
    } catch (error) {
        console.error("Error toggling follow:", error);
        throw new Error("Failed to toggle follow status.");
    }
}
