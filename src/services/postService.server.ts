
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Post, PostTag, User, Comment } from '@/lib/types';
import { getUserById, getUserByUsername } from './userService.server';
import { createActivity } from './activityService.server';

async function processMentions(text: string, actorId: string, postId: string) {
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex);
    if (!mentions) return;

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

// Helper to serialize any kind of timestamp (Firestore Timestamp, JS Date, or number)
// This is critical to prevent serialization errors on the client (processBinaryChunk).
function serializeTimestamp(ts: any): number | null {
    if (!ts) return null;
    if (typeof ts.toMillis === 'function') return ts.toMillis(); // Firestore Timestamp
    if (typeof ts.getTime === 'function') return ts.getTime(); // JavaScript Date
    return ts; // Already a number
}

async function processPostDoc(docSnapshot: FirebaseFirestore.DocumentSnapshot): Promise<Post | null> {
    const data = docSnapshot.data();
    if (!data) return null;

    const user = await getFullUser(data.userId);
    if (!user) return null;

    const collaborators = data.collaboratorIds ? await Promise.all(data.collaboratorIds.map(getFullUser)) : [];
    
    const commentsWithUsers = data.comments ? await Promise.all(data.comments.map(async (comment: any) => {
        const commentUser = await getFullUser(comment.userId);
        if (!commentUser) return null;
        // The comment timestamp is explicitly serialized to a number.
        return { ...comment, user: commentUser, timestamp: serializeTimestamp(comment.timestamp) };
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
        comments: commentsWithUsers.filter(Boolean),
        // The main post timestamp is explicitly serialized to a number.
        timestamp: serializeTimestamp(data.timestamp),
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
    
    await processMentions(postData.caption, postData.userId, docRef.id);

    return docRef.id;
}

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.update(data);

    if (data.caption) {
        const post = await getPostById(postId);
        if (post) {
            await processMentions(data.caption, post.user.id, postId);
        }
    }
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


export async function addComment(postId: string, comment: { userId: string, text: string }): Promise<Comment> {
  const postRef = adminDb.collection('posts').doc(postId);
  
  const newComment = {
    ...comment,
    timestamp: new Date(), // This becomes a Firestore Timestamp in the DB
    id: adminDb.collection('tmp').doc().id
  };

  await postRef.update({
    comments: FieldValue.arrayUnion(newComment)
  });
  
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
      await processMentions(comment.text, comment.userId, postId);
  }

  const user = await getUserById(comment.userId);
  if(!user) throw new Error("Comment user not found");

  // Explicitly build the final object to return to the client
  const finalComment: Comment = {
      id: newComment.id,
      text: newComment.text,
      userId: newComment.userId,
      user: user,
      timestamp: newComment.timestamp.getTime() // Ensure it's a number
  };

  return finalComment;
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

export async function getPostsByUserId(userId: string): Promise<Post[]> {
  try {
    const postsCollection = adminDb.collection('posts');
    const q = postsCollection
        .where('status', '==', 'published')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc');
    const querySnapshot = await q.get();

    userCache.clear();
    const posts = await Promise.all(querySnapshot.docs.map(processPostDoc));

    return posts.filter((p): p is Post => p !== null);
  } catch (error) {
    console.error("Error fetching posts by user ID:", error);
    return [];
  }
}

export async function getLikedPostsByUserId(userId: string): Promise<Post[]> {
    try {
      const postsCollection = adminDb.collection('posts');
      const q = postsCollection
          .where('likedBy', 'array-contains', userId)
          .where('status', '==', 'published')
          .orderBy('timestamp', 'desc');
      const querySnapshot = await q.get();
      userCache.clear();
      const posts = await Promise.all(querySnapshot.docs.map(processPostDoc));
      return posts.filter((p): p is Post => p !== null);
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
        const postPromises = postIds.map(id => getPostById(id));
        const posts = await Promise.all(postPromises);
        return posts.filter((p): p is Post => p !== null && p.status === 'published');
    } catch (error) {
        console.error("Error fetching saved posts:", error);
        return [];
    }
}
