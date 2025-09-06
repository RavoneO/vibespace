
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';
import type { Post, Comment } from '@/lib/types';
import { getUserById } from './userService';
import { users as mockUsers } from '@/lib/data'; // fallback

// Function to get a user by ID, with fallback to mock data
async function getFullUser(userId: string) {
    const user = await getUserById(userId);
    return user || mockUsers.find(u => u.id === userId) || mockUsers[0];
}

export async function getPosts(): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const posts: Post[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const user = await getFullUser(data.userId);
      
      const comments: Comment[] = await Promise.all(
          (data.comments || []).map(async (comment: any) => ({
              ...comment,
              user: await getFullUser(comment.userId)
          }))
      );

      return {
        id: doc.id,
        user,
        type: data.type,
        contentUrl: data.contentUrl,
        caption: data.caption,
        hashtags: data.hashtags,
        likes: data.likes,
        comments,
        timestamp: data.timestamp,
        dataAiHint: data.dataAiHint,
      };
    }));
    
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export async function getPostsByUserId(userId: string): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    const user = await getFullUser(userId);

    const posts: Post[] = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const comments: Comment[] = await Promise.all(
            (data.comments || []).map(async (comment: any) => ({
                ...comment,
                user: await getFullUser(comment.userId)
            }))
        );

        return {
            id: doc.id,
            user,
            type: data.type,
            contentUrl: data.contentUrl,
            caption: data.caption,
            hashtags: data.hashtags,
            likes: data.likes,
            comments,
            timestamp: data.timestamp,
            dataAiHint: data.dataAiHint,
        };
    }));

    return posts;
  } catch (error) {
    console.error("Error fetching posts by user ID:", error);
    return [];
  }
}
