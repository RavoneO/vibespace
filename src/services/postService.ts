
"use client";

import { db, storage } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, arrayUnion, addDoc, serverTimestamp, increment, arrayRemove, limit, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import type { Post, Comment, User, PostTag } from '@/lib/types';
import { getUserById, getUserByUsername } from './userService';
import { createActivity } from './activityService';
import { analyzeContent } from '@/ai/flows/ai-content-analyzer';

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
    
    // Fetch collaborators if they exist
    let collaborators: User[] = [];
    if (Array.isArray(data.collaboratorIds) && data.collaboratorIds.length > 0) {
        const collaboratorPromises = data.collaboratorIds.map((id: string) => getFullUser(id));
        collaborators = await Promise.all(collaboratorPromises);
    }

    return {
      id: doc.id,
      user,
      collaborators,
      type: data.type,
      contentUrl: data.contentUrl,
      caption: data.caption,
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
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
        where('status', '==', 'published'),
        where('userId', '==', userId), 
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
    tags: PostTag[];
    collaboratorIds?: string[];
}) {
    try {
        const moderationResult = await analyzeContent({ text: postData.caption });
        if (!moderationResult.isAllowed) {
            throw new Error(moderationResult.reason || "This content is not allowed.");
        }

        const docRef = await addDoc(collection(db, 'posts'), {
            userId: postData.userId,
            type: postData.type,
            caption: postData.caption,
            hashtags: postData.hashtags,
            tags: postData.tags,
            collaboratorIds: postData.collaboratorIds || [],
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

// Helper to find mentions and create notifications
const processMentions = async (text: string, actorId: string, postId: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex);
    if (!mentions) return;

    // Use a Set to avoid duplicate notifications for the same user
    const mentionedUsernames = new Set(mentions.map(m => m.substring(1)));

    for (const username of mentionedUsernames) {
        const user = await getUserByUsername(username);
        if (user && user.id !== actorId) {
            await createActivity({
                type: 'mention',
                actorId: actorId,
                notifiedUserId: user.id,
                postId: postId
            });
        }
    }
};

export async function updatePost(postId: string, data: Partial<Post>) {
    try {
        if (data.caption) {
            const moderationResult = await analyzeContent({ text: data.caption });
            if (!moderationResult.isAllowed) {
                throw new Error(moderationResult.reason || "This caption is not allowed.");
            }
        }

        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, data as any);

        // If caption is updated or post is newly published, process mentions
        if (data.caption || data.status === 'published') {
            const postDoc = await getDoc(postRef);
            const postData = postDoc.data();
            if (postData) {
                await processMentions(postData.caption, postData.userId, postId);
            }
        }

    } catch (error) {
        console.error("Error updating post:", error);
        throw new Error("Failed to update post.");
    }
}


export async function addComment(postId: string, commentData: { userId: string, text: string }) {
    try {
        const moderationResult = await analyzeContent({ text: commentData.text });
        if (!moderationResult.isAllowed) {
            throw new Error(moderationResult.reason || "This comment is not allowed.");
        }

        const postRef = doc(db, 'posts', postId);
        const newComment = {
            id: doc(collection(db, 'random_ids')).id, // Generate a unique ID for the comment
            ...commentData,
            timestamp: serverTimestamp()
        };
        await updateDoc(postRef, {
            comments: arrayUnion(newComment)
        });

        const postDoc = await getDoc(postRef);
        const postData = postDoc.data();
        if(!postData) return;

        // Create activity notification for the comment itself
        if (postData.userId !== commentData.userId) {
            await createActivity({
                type: 'comment',
                actorId: commentData.userId,
                notifiedUserId: postData.userId,
                postId: postId
            });
        }
        
        // Process mentions in the comment
        await processMentions(commentData.text, commentData.userId, postId);

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
    
    const postData = await processPostDoc(postDoc);
    
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
