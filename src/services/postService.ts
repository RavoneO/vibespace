
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
import type { Post, PostTag, User } from '@/lib/types';
import { getUserById } from './userService';
import { createActivity } from './activityService';
import { analyzeContent, processMentions } from './contentService';

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


async function processPostDoc(doc: any): Promise<Post> {
    const data = doc.data();
    if (!data) throw new Error(`Post data not found for doc ${doc.id}`);

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
    const posts: Post[] = await Promise.all(querySnapshot.docs.map(processPostDoc));
    
    return posts;
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
        userCache.clear();
        return await processPostDoc(postDoc);
    } catch (error) {
        console.error("Error fetching post by ID:", error);
        return null;
    }
}


export async function getPostsByUserId(userId: string): Promise<Post[]> {
  try {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection,
        where('status', '==', 'published'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

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
      const postsCollection = collection(db, 'posts');
      const q = query(postsCollection,
          where('likedBy', 'array-contains', userId),
          where('status', '==', 'published'),
          orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
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
        const postsCollection = collection(db, 'posts');
        const q = query(postsCollection,
            where('hashtags', 'array-contains', `#${hashtag}`),
            where('status', '==', 'published'),
            orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
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
    const postRef = doc(db, 'posts', postId);
    
    const newComment = {
        id: doc(collection(db, 'posts')).id, // Generate a unique ID for the comment
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

    // Handle mentions
    await processMentions(commentData.text, commentData.userId, postId);
}

export async function deletePost(postId: string) {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
}

export async function toggleLike(postId: string, userId: string) {
    const postRef = doc(db, 'posts', postId);
    
    return runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
            throw new Error("Post not found");
        }

        const postData = postDoc.data()!;
        const likedBy = postData.likedBy || [];
        let isLiked;

        if (likedBy.includes(userId)) {
            // Unlike
            transaction.update(postRef, {
                likedBy: arrayRemove(userId),
                likes: (postData.likes || 0) - 1
            });
            isLiked = false;
        } else {
            // Like
            transaction.update(postRef, {
                likedBy: arrayUnion(userId),
                likes: (postData.likes || 0) + 1
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
