
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, arrayUnion, addDoc, serverTimestamp, increment, arrayRemove } from 'firebase/firestore';
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
        likedBy: data.likedBy || [],
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
            likedBy: data.likedBy || [],
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


export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    contentUrl: string;
    caption: string;
    hashtags: string[];
}) {
    try {
        await addDoc(collection(db, 'posts'), {
            ...postData,
            likes: 0,
            likedBy: [],
            comments: [],
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating post:", error);
        throw new Error("Failed to create post.");
    }
}

export async function addComment(postId: string, commentData: { userId: string, text: string }) {
    try {
        const postRef = doc(db, 'posts', postId);
        const newComment = {
            id: doc(collection(db, 'comments')).id, // Generate a unique ID for the comment
            ...commentData,
            timestamp: serverTimestamp()
        };
        await updateDoc(postRef, {
            comments: arrayUnion(newComment)
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        throw new Error("Failed to add comment.");
    }
}

export async function toggleLike(postId: string, userId: string) {
    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            throw new Error("Post not found");
        }

        const postData = postDoc.data();
        const likedBy = postData.likedBy || [];
        
        let newLikes;
        let newLikedBy;

        if (likedBy.includes(userId)) {
            // User has already liked the post, so unlike it
            newLikes = increment(-1);
            newLikedBy = arrayRemove(userId);
        } else {
            // User has not liked the post, so like it
            newLikes = increment(1);
            newLikedBy = arrayUnion(userId);
        }

        await updateDoc(postRef, {
            likes: newLikes,
            likedBy: newLikedBy
        });

    } catch (error) {
        console.error("Error toggling like:", error);
        throw new Error("Failed to toggle like.");
    }
}
