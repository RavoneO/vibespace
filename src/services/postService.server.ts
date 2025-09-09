

import { firestore as adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import type { Post, User, Comment, PostTag } from '@/lib/types';
import { getUserById, getUserByUsername } from './userService.server';
import { createActivity } from './activityService.server';
import { analyzeContent, processMentions } from './contentService.server';


const userCache = new Map<string, User>();
async function getFullUser(userId: string): Promise<User> {
    if (userCache.has(userId)) {
        return userCache.get(userId)!;
    }
    const user = await getUserById(userId);
    if (!user) {
        // Handle case where user might be deleted but their content remains.
        const deletedUser: User = { id: userId, name: "Deleted User", username: "deleteduser", email: "", avatar: "", bio: "", followers: [], following: [], savedPosts: [] };
        userCache.set(userId, deletedUser);
        return deletedUser;
    }
    userCache.set(userId, user);
    return user;
}

async function processPostDoc(doc: admin.firestore.DocumentSnapshot): Promise<Post> {
    const data = doc.data();
    if (!data) throw new Error(`Post data not found for doc ${doc.id}`);

    // Use a set to avoid duplicate fetches
    const userIdsToFetch = new Set<string>([data.userId]);
    if (data.collaboratorIds) {
        data.collaboratorIds.forEach((id: string) => userIdsToFetch.add(id));
    }
    const commentsData = Array.isArray(data.comments) ? data.comments : [];
    commentsData.forEach(c => userIdsToFetch.add(c.userId));

    await Promise.all(Array.from(userIdsToFetch).map(id => getFullUser(id)));

    const user = userCache.get(data.userId)!;
    const collaborators = data.collaboratorIds?.map((id: string) => userCache.get(id)!) || [];
    
    const comments = commentsData.map((comment: any) => ({
        ...comment,
        user: userCache.get(comment.userId)!,
    })).filter(c => c.user); // Filter out comments from users that couldn't be fetched

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
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'processing',
    });
    return docRef.id;
}

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
    if (data.caption) {
        const moderationResult = await analyzeContent({ text: data.caption });
        if (!moderationResult.isAllowed) {
            throw new Error(moderationResult.reason || 'This content is not allowed.');
        }
    }
    const postRef = adminDb.collection('posts').doc(postId);
    await postRef.update(data);
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
    const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));
    
    return posts;
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
    const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));
    
    return posts;
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


export async function getPostsByUserId(userId: string): Promise<Post[]> {
  try {
    const postsCollection = adminDb.collection('posts');
    const q = postsCollection
        .where('status', '==', 'published')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc');
    const querySnapshot = await q.get();

    userCache.clear();
    const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));

    return posts;
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
      const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));
      return posts;
    } catch (error) {
      console.error("Error fetching liked posts by user ID:", error);
      return [];
    }
  }

export async function getPostsByHashtag(hashtag: string): Promise<Post[]> {
    try {
        const postsCollection = adminDb.collection('posts');
        const q = postsCollection
            .where('hashtags', 'array-contains', `#${hashtag}`)
            .where('status', '==', 'published')
            .orderBy('timestamp', 'desc');
        const querySnapshot = await q.get();
        userCache.clear();
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

export async function addComment(postId: string, commentData: { userId: string, text: string }) {
    const moderationResult = await analyzeContent({ text: commentData.text });
    if (!moderationResult.isAllowed) {
        throw new Error(moderationResult.reason || 'This comment is not allowed.');
    }
    const postRef = adminDb.collection('posts').doc(postId);
    
    const newComment = {
        id: adminDb.collection('posts').doc().id, // Generate a unique ID for the comment
        ...commentData,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    await postRef.update({
        comments: admin.firestore.FieldValue.arrayUnion(newComment)
    });

    const postDoc = await postRef.get();
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

    // Handle mentions
    await processMentions(commentData.text, commentData.userId, postId);
}

export async function deletePost(postId: string) {
    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
        throw new Error("Post not found");
    }

    // You might want to delete associated content from storage here as well
    // For example:
    // const postData = postDoc.data();
    // if (postData.contentUrl) {
    //     const storageRef = adminStorage.refFromURL(postData.contentUrl);
    //     await storageRef.delete();
    // }

    await postRef.delete();
}

export async function toggleLike(postId: string, userId: string) {
    const postRef = adminDb.collection('posts').doc(postId);
    
    return adminDb.runTransaction(async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists) {
            throw new Error("Post not found");
        }

        const postData = postDoc.data()!;
        const likedBy = postData.likedBy || [];
        let isLiked;

        if (likedBy.includes(userId)) {
            // Unlike
            transaction.update(postRef, {
                likedBy: admin.firestore.FieldValue.arrayRemove(userId),
                likes: admin.firestore.FieldValue.increment(-1)
            });
            isLiked = false;
        } else {
            // Like
            transaction.update(postRef, {
                likedBy: admin.firestore.FieldValue.arrayUnion(userId),
                likes: admin.firestore.FieldValue.increment(1)
            });
            isLiked = true;

            if (postData.userId !== userId) {
                await createActivity({
                    type: 'like',
                    actorId: userId,
                    notifiedUserId: postData.userId,
                    postId: postId
                });
            }
        }
        return isLiked;
    });
}
