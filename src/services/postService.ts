
'use server';

import { db } from '@/lib/firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    doc, 
    updateDoc, 
    getDocs, 
    query, 
    where,     
    orderBy, 
    limit,
    getDoc,
    arrayUnion,
    arrayRemove,
    runTransaction,
    deleteDoc
} from 'firebase/firestore';
import type { Post, PostTag, User, Comment } from '@/lib/types';
import { getUserById } from './userService';
import { createActivity } from './activityService';
import { analyzeContent, processMentions } from './contentService';

const userCache = new Map<string, User>();

async function getFullUser(userId: string): Promise<User | null> {
    if (userCache.has(userId)) {
        return userCache.get(userId)!;
    }
    const user = await getUserById(userId);
    if (user) {
        userCache.set(userId, user);
    }
    return user;
}


async function processPostDoc(docSnapshot: any): Promise<Post | null> {
    const data = docSnapshot.data();
    if (!data) return null;

    const user = await getFullUser(data.userId);
    if (!user) return null;

    const collaborators = data.collaboratorIds ? await Promise.all(data.collaboratorIds.map(getFullUser)) : [];
    
    const comments = data.comments ? await Promise.all(data.comments.map(async (comment: any) => {
        const commentUser = await getFullUser(comment.userId);
        return commentUser ? { ...comment, user: commentUser } : null;
    })) : [];

    return {
        id: docSnapshot.id,
        user,
        collaborators: collaborators.filter(Boolean) as User[],
        type: data.type,
        contentUrl: data.contentUrl,
        caption: data.caption,
        hashtags: data.hashtags || [],
        tags: data.tags || [],
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        comments: comments.filter(Boolean),
        timestamp: data.timestamp,
        status: data.status,
        dataAiHint: data.dataAiHint,
    } as Post;
}

export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    caption: string;
    hashtags: string[];
    tags?: PostTag[];
    collaboratorIds?: string[];
}) {
    const moderationResult = await analyzeContent({ text: postData.caption });
    if (!moderationResult.isAllowed) {
        throw new Error(moderationResult.reason || 'This content is not allowed.');
    }

    const docRef = await addDoc(collection(db, 'posts'),{
        userId: postData.userId,
        type: postData.type,
        caption: postData.caption,
        hashtags: postData.hashtags,
        tags: postData.tags || [],
        collaboratorIds: postData.collaboratorIds || [],
        contentUrl: '',
        likes: 0,
        likedBy: [],
        comments: [],
        timestamp: serverTimestamp(),
        status: 'processing',
    });
    
    // Process mentions after post is created
    await processMentions(postData.caption, postData.userId, docRef.id);

    return docRef.id;
}

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
    if (data.caption) {
        const moderationResult = await analyzeContent({ text: data.caption });
        if (!moderationResult.isAllowed) {
            throw new Error(moderationResult.reason || 'This content is not allowed.');
        }
    }
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, data);
    
    if (data.caption && data.status === 'published') {
        const post = await getPostById(postId);
        if (post) {
            await processMentions(data.caption, post.user.id, postId);
        }
    }
}

export async function deletePost(postId: string) {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
}


export async function getPosts(): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection,
        where('status', '==', 'published'),
        orderBy('timestamp', 'desc'),
        limit(50));
    
    const querySnapshot = await getDocs(q);
    userCache.clear();
    const posts = await Promise.all(querySnapshot.docs.map(processPostDoc));
    return posts.filter((p): p is Post => p !== null);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export async function getReels(): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection,
        where('status', '==', 'published'),
        where('type', '==', 'video'),
        orderBy('timestamp', 'desc'),
        limit(50));
    const querySnapshot = await getDocs(q);
    
    userCache.clear();
    const posts = await Promise.all(querySnapshot.docs.map(processPostDoc));
    return posts.filter((p): p is Post => p !== null);
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
        userCache.clear();
        return await processPostDoc(postDoc);
    } catch (error) {
        console.error("Error fetching post by ID:", error);
        return null;
    }
}


export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const postRef = doc(db, 'posts', postId);

  let isLiked = false;
  
  await runTransaction(db, async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) {
      throw new Error("Post does not exist!");
    }
    
    const postData = postDoc.data();
    const likedBy: string[] = postData.likedBy || [];
    
    if (likedBy.includes(userId)) {
      // Unlike
      transaction.update(postRef, { 
        likedBy: arrayRemove(userId),
        likes: (postData.likes || 1) - 1,
      });
      isLiked = false;
    } else {
      // Like
      transaction.update(postRef, { 
        likedBy: arrayUnion(userId),
        likes: (postData.likes || 0) + 1,
      });
      isLiked = true;
    }
  });

  // Create activity notification outside the transaction
  if (isLiked) {
      const post = await getPostById(postId);
      if (post && post.user.id !== userId) {
        await createActivity({
            type: 'like',
            actorId: userId,
            notifiedUserId: post.user.id,
            postId: postId,
        });
      }
  }

  return isLiked;
}


export async function addComment(postId: string, comment: { userId: string, text: string }) {
  const postRef = doc(db, 'posts', postId);

  const moderationResult = await analyzeContent({ text: comment.text });
  if (!moderationResult.isAllowed) {
      throw new Error(moderationResult.reason || 'This content is not allowed.');
  }
  
  const newComment = {
    ...comment,
    timestamp: new Date(),
    id: doc(collection(db, 'tmp')).id // Generate a unique ID for the comment
  };

  await updateDoc(postRef, {
    comments: arrayUnion(newComment)
  });
  
  // Handle Mentions & Notifications
  const post = await getPostById(postId);
  if (post) {
      await processMentions(comment.text, comment.userId, postId);
      if (post.user.id !== comment.userId) {
          await createActivity({
              type: 'comment',
              actorId: comment.userId,
              notifiedUserId: post.user.id,
              postId: postId,
          });
      }
  }
}
