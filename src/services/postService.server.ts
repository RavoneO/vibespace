'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Post, PostTag, User, Comment } from '@/lib/types';
import { getUserById, getUserByUsername } from './userService.server';

// Note: createActivity is removed as its logic is now inside batches.

async function processMentions(
    batch: FirebaseFirestore.WriteBatch,
    text: string,
    actorId: string,
    postId: string,
    notifiedUserIds: Set<string>
) {
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex);
    if (!mentions) return;

    const mentionedUsernames = new Set(mentions.map(m => m.substring(1)));
    const mentionedUsers = await Promise.all(
        Array.from(mentionedUsernames).map(username => getUserByUsername(username))
    );

    for (const user of mentionedUsers) {
        if (user && user.id !== actorId && !notifiedUserIds.has(user.id)) {
            const mentionActivityRef = adminDb.collection('activity').doc();
            batch.set(mentionActivityRef, {
                type: 'mention',
                actorId: actorId,
                notifiedUserId: user.id,
                postId: postId,
                timestamp: FieldValue.serverTimestamp(),
                seen: false,
            });
            notifiedUserIds.add(user.id);
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

function serializeTimestamp(ts: any): number | null {
    if (!ts) return null;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.getTime === 'function') return ts.getTime();
    return ts;
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
    const batch = adminDb.batch();
    const postRef = adminDb.collection('posts').doc();

    batch.set(postRef, {
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
    
    await processMentions(batch, postData.caption, postData.userId, postRef.id, new Set([postData.userId]));
    
    await batch.commit();

    return postRef.id;
}

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.update(data);
}

export async function deletePost(postId: string) {
    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.delete();
}

export async function likePost(postId: string, userId: string) {
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) throw new Error("Post not found");

    const postData = postDoc.data()!;
    if (postData.likedBy.includes(userId)) return; // User already liked the post

    const batch = adminDb.batch();

    batch.update(postRef, {
        likes: FieldValue.increment(1),
        likedBy: FieldValue.arrayUnion(userId)
    });

    if (postData.userId !== userId) {
        const activityRef = adminDb.collection('activity').doc();
        batch.set(activityRef, {
            type: 'like',
            actorId: userId,
            notifiedUserId: postData.userId,
            postId: postId,
            timestamp: FieldValue.serverTimestamp(),
            seen: false,
        });
    }

    await batch.commit();
}

export async function unlikePost(postId: string, userId: string) {
    const postRef = adminDb.collection('posts').doc(postId);

    await adminDb.runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists) throw new Error("Post not found");
        const postData = postDoc.data()!;

        if (!postData.likedBy.includes(userId)) return; // User hasn't liked the post

        transaction.update(postRef, {
            likes: FieldValue.increment(-1),
            likedBy: FieldValue.arrayRemove(userId)
        });
        
        // Note: We are not deleting the 'like' activity to keep the notification history.
    });
}


export async function addComment(postId: string, comment: { userId: string, text: string }): Promise<Comment> {
    const postRef = adminDb.collection('posts').doc(postId);
    const user = await getUserById(comment.userId);
    if (!user) throw new Error("Comment user not found");

    let finalComment: Comment;

    await adminDb.runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists) throw new Error("Post not found");
        
        const postData = postDoc.data()!;
        const notifiedUserIds = new Set([comment.userId]);

        const newComment = {
            ...comment,
            timestamp: new Date(),
            id: adminDb.collection('tmp').doc().id
        };

        transaction.update(postRef, {
            comments: FieldValue.arrayUnion(newComment)
        });

        if (postData.userId !== comment.userId) {
            const activityRef = adminDb.collection('activity').doc();
            transaction.set(activityRef, {
                type: 'comment',
                actorId: comment.userId,
                notifiedUserId: postData.userId,
                postId: postId,
                timestamp: FieldValue.serverTimestamp(),
                seen: false,
            });
            notifiedUserIds.add(postData.userId);
        }

        // Mentions are handled outside the transaction as they require async lookups
        
        finalComment = {
            id: newComment.id,
            text: newComment.text,
            userId: newComment.userId,
            user: user,
            timestamp: newComment.timestamp.getTime()
        };
    });
    
    // Handle mentions after the main transaction. 
    // It's a reasonable trade-off as comment/mention notifications are separate concerns.
    const batch = adminDb.batch();
    const postDoc = await postRef.get();
    const postData = postDoc.data()!;
    const notifiedUserIds = new Set([comment.userId, postData.userId]);
    await processMentions(batch, comment.text, comment.userId, postId, notifiedUserIds);
    await batch.commit();


    return finalComment!;
}


export async function getPosts(): Promise<Post[]> {
  try {
    const postsCollection = adminDb.collection('posts');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const q = postsCollection
        .where('status', '==', 'published')
        .where('timestamp', '>=', sevenDaysAgo)
        .orderBy('timestamp', 'desc');
    
    const querySnapshot = await q.get();
    userCache.clear();
    const posts = await Promise.all(querySnapshot.docs.map(processPostDoc));
    const validPosts = posts.filter((p): p is Post => p !== null);

    const sortedPosts = validPosts
      .map(post => {
        const commentCount = post.comments ? post.comments.length : 0;
        const likeCount = post.likes || 0;
        const score = likeCount + commentCount * 2;
        return { ...post, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

    return sortedPosts.slice(0, 50);

  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export const getPostsForUser = getPostsByUserId;
export const getLikedPosts = getLikedPostsByUserId;

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

export async function getPostsForUserFeed(userId: string): Promise<Post[]> {
  try {
    const likedPosts = await getLikedPostsByUserId(userId);
    if (likedPosts.length === 0) {
      return [];
    }

    const similarUserIds = new Set<string>();
    likedPosts.forEach(post => {
      post.likedBy.forEach(likerId => {
        if (likerId !== userId) {
          similarUserIds.add(likerId);
        }
      });
    });

    let recommendedPosts: Post[] = [];
    for (const similarUserId of Array.from(similarUserIds)) {
      const posts = await getLikedPostsByUserId(similarUserId);
      recommendedPosts.push(...posts);
    }

    const uniquePosts = Array.from(new Map(recommendedPosts.map(post => [post.id, post])).values());
    const sortedPosts = uniquePosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return sortedPosts;
  } catch (error) {
    console.error("Error generating user feed:", error);
    return [];
  }
}
