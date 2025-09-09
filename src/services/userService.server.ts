import { firestore as adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

export async function getUserById(userId: string): Promise<User | null> {
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

export async function searchUsers(searchText: string): Promise<User[]> {
    if (!searchText.trim()) {
        return [];
    }
    try {
        const usersCollection = adminDb.collection('users');
        const q = usersCollection
            .orderBy('username')
            .startAt(searchText.toLowerCase())
            .endAt(searchText.toLowerCase() + '\uf8ff');
            
        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
}
