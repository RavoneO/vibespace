
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Post, PostTag, User, Comment } from '@/lib/types';
import { getUserById } from './userService.server';
import { createActivity } from './activityService';

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


async function processPostDoc(docSnapshot: FirebaseFirestore.DocumentSnapshot): Promise<Post | null> {
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
    const docRef = await adminDb.collection('posts').add({
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
        timestamp: FieldValue.serverTimestamp(),
        status: 'processing',
    });

    return docRef.id;
}

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.update(data);
}

export async function deletePost(postId: string) {
    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.delete();
}


export async function getPosts(): Promise<Post[]> {
  try {
    const postsCollection = adminDb.collection('posts');
    const q = postsCollection
        .where('status', '==', 'published')
        .orderBy('timestamp', 'desc')
        .limit(50);
    
    const querySnapshot = await q.get();
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
    const postsCollection = adminDb.collection('posts');
    const q = postsCollection
        .where('status', '==', 'published')
        .where('type', '==', 'video')
        .orderBy('timestamp', 'desc')
        .limit(50);
    const querySnapshot = await q.get();
    
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
        const postRef = adminDb.collection('posts').doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
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
  const postRef = adminDb.collection('posts').doc(postId);

  let isLiked = false;
  
  await adminDb.runTransaction(async (transaction) => {
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists) {
      throw new Error("Post does not exist!");
    }
    
    const postData = postDoc.data();
    if (!postData) throw new Error("Post data not found");
    const likedBy: string[] = postData.likedBy || [];
    
    if (likedBy.includes(userId)) {
      // Unlike
      transaction.update(postRef, { 
        likedBy: FieldValue.arrayRemove(userId),
        likes: FieldValue.increment(-1),
      });
      isLiked = false;
    } else {
      // Like
      transaction.update(postRef, { 
        likedBy: FieldValue.arrayUnion(userId),
        likes: FieldValue.increment(1),
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
  const postRef = adminDb.collection('posts').doc(postId);
  
  const newComment = {
    ...comment,
    timestamp: new Date(),
    id: adminDb.collection('tmp').doc().id // Generate a unique ID for the comment
  };

  await postRef.update({
    comments: FieldValue.arrayUnion(newComment)
  });
  
  // Handle Mentions & Notifications
  const post = await getPostById(postId);
  if (post) {
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

export async function getPostsByHashtag(tag: string): Promise<Post[]> {
  try {
    const postsCollection = adminDb.collection('posts');
    const q = postsCollection
      .where('status', '==', 'published')
      .where('hashtags', 'array-contains', `#${tag}`)
      .orderBy('timestamp', 'desc');
    const querySnapshot = await q.get();
    const posts = await Promise.all(
      querySnapshot.docs.map((doc) => processPostDoc(doc))
    );
    return posts.filter((p): p is Post => p !== null);
  } catch (error) {
    console.error(`Error fetching posts for hashtag #${tag}:`, error);
    return [];
  }
}
