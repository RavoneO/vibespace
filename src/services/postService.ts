
"use client";

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, arrayUnion, addDoc, serverTimestamp, increment, arrayRemove, limit, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import type { Post, Comment, User } from '@/lib/types';
import { getUserById } from './userService';
import { createActivity } from './activityService';

// Function to get a user by ID, with fallback to mock data
async function getFullUser(userId: string) {
    const user = await getUserById(userId);
    if (user) return user;
    // Fallback for cases where a user might be deleted but their content remains.
    return { id: userId, name: "Unknown User", username: "unknown", avatar: "", bio: ""};
}

async function processPostDoc(doc: any): Promise<Post> {
    const data = doc.data();
    const user = await getFullUser(data.userId);
    
    // Fetch all comments and then get user details.
    const commentsData = Array.isArray(data.comments) ? data.comments : [];
    const comments: Comment[] = await Promise.all(
        commentsData.map(async (comment: any) => ({
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
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
      likes: data.likes || 0,
      likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
      comments,
      timestamp: data.timestamp,
      status: data.status,
      dataAiHint: data.dataAiHint,
    } as Post;
}


export async function getPosts(): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    // Query for published posts and order by timestamp.
    // Firestore requires an index for this query. If it fails, the index needs to be created in the Firebase console.
    const q = query(
        postsCollection, 
        where('status', '==', 'published'), 
        orderBy('timestamp', 'desc'), 
        limit(50) // Limit to the latest 50 posts for performance
    );
    const querySnapshot = await getDocs(q);
    
    const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));
    
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    // If you see an error here about a missing index, you need to create it in your Firebase project's Firestore settings.
    return [];
  }
}

export async function getReels(): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(
        postsCollection, 
        where('status', '==', 'published'), 
        where('type', '==', 'video'),
        orderBy('timestamp', 'desc'), 
        limit(50)
    );
    const querySnapshot = await getDocs(q);
    
    const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));
    
    return posts;
  } catch (error) {
    console.error("Error fetching reels:", error);
    return [];
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
    try {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);
        if (!postDoc.exists()) {
            return null;
        }
        return await processPostDoc(postDoc);
    } catch (error) {
        console.error("Error fetching post by ID:", error);
        return null;
    }
}


export async function getPostsByUserId(userId: string): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(
        postsCollection, 
        where('userId', '==', userId), 
        where('status', '==', 'published'),
        orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));

    return posts;
  } catch (error) {
    console.error("Error fetching posts by user ID:", error);
    return [];
  }
}

export async function getPostsByHashtag(hashtag: string): Promise<Post[]> {
    try {
        const postsCollection = collection(db, 'posts');
        const q = query(
            postsCollection,
            where('hashtags', 'array-contains', `#${hashtag}`),
            where('status', '==', 'published'),
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));
        return posts;
    } catch (error) {
        console.error("Error fetching posts by hashtag:", error);
        return [];
    }
}

export async function getSavedPosts(postIds: string[]): Promise<Post[]> {
    if (!postIds || postIds.length === 0) {
        return [];
    }
    try {
        const postPromises = postIds.map(id => getPostById(id));
        const posts = await Promise.all(postPromises);
        return posts.filter((p): p is Post => p !== null && p.status === 'published');
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        return [];
    }
}


export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    caption: string;
    hashtags: string[];
}) {
    try {
        const docRef = await addDoc(collection(db, 'posts'), {
            ...postData,
            contentUrl: '',
            likes: 0,
            likedBy: [],
            comments: [],
            timestamp: serverTimestamp(),
            status: 'processing',
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating post:", error);
        throw new Error("Failed to create post.");
    }
}

export async function updatePost(postId: string, data: Partial<Post>) {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, data as any);
    } catch (error) {
        console.error("Error updating post:", error);
        throw new Error("Failed to update post.");
    }
}


export async function addComment(postId: string, commentData: { userId: string, text: string }) {
    try {
        const postRef = doc(db, 'posts', postId);
        const newComment = {
            id: doc(collection(db, 'random_ids')).id, // Generate a unique ID for the comment
            ...commentData,
            timestamp: serverTimestamp()
        };
        await updateDoc(postRef, {
            comments: arrayUnion(newComment)
        });

        // Create activity notification
        const postDoc = await getDoc(postRef);
        const postData = postDoc.data() as Post;
        if (postData.userId !== commentData.userId) {
            await createActivity({
                type: 'comment',
                actorId: commentData.userId,
                notifiedUserId: postData.userId,
                postId: postId
            });
        }

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
        
        if (likedBy.includes(userId)) {
            // User has already liked the post, so unlike it
            await updateDoc(postRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
        } else {
            // User has not liked the post, so like it
            await updateDoc(postRef, {
                likes: increment(1),
                likedBy: arrayUnion(userId)
            });
            // Create activity notification only when liking
            if(postData.userId !== userId) {
                 await createActivity({
                    type: 'like',
                    actorId: userId,
                    notifiedUserId: postData.userId,
                    postId: postId
                });
            }
        }

    } catch (error) {
        console.error("Error toggling like:", error);
        throw new Error("Failed to toggle like.");
    }
}

export async function deletePost(postId: string) {
  const postRef = doc(db, 'posts', postId);
  
  try {
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      throw new Error("Post not found");
    }
    
    const postData = postDoc.data() as Post;
    
    // Delete media from Cloud Storage
    if (postData.contentUrl) {
      try {
        const fileRef = ref(storage, postData.contentUrl);
        await deleteObject(fileRef);
      } catch (storageError: any) {
        // It's okay if the object doesn't exist, it might have been deleted already or failed to upload.
        if (storageError.code !== 'storage/object-not-found') {
          console.error("Error deleting file from storage:", storageError);
          // We might still want to delete the post doc, so we don't re-throw here unless it's critical.
        }
      }
    }
    
    // Delete the post document from Firestore
    await deleteDoc(postRef);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw new Error("Failed to delete post.");
  }
}
