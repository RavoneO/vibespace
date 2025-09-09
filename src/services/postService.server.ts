
import { firestore as adminDb } from '@/lib/firebase-admin';
import type { Post, User } from '@/lib/types';
import { getUserById, getUserByUsername } from './userService.server';
import { createActivity } from './activityService.server';


const userCache = new Map<string, User>();
async function getFullUser(userId: string): Promise<User> {
    if (userCache.has(userId)) {
        return userCache.get(userId)!;
    }
    const user = await getUserById(userId);
    const result = user || { id: userId, name: "Unknown User", username: "unknown", avatar: "", bio: "" };
    userCache.set(userId, result);
    return result;
}

async function processPostDoc(doc: admin.firestore.DocumentSnapshot): Promise<Post> {
    const data = doc.data();
    if (!data) throw new Error(`Post data not found for doc ${doc.id}`);

    const userPromises = [getFullUser(data.userId)];
    if (data.collaboratorIds) {
        data.collaboratorIds.forEach((id: string) => userPromises.push(getFullUser(id)));
    }

    const commentsData = Array.isArray(data.comments) ? data.comments : [];
    const commenterIds = commentsData.map(c => c.userId);
    commenterIds.forEach(id => userPromises.push(getFullUser(id)));

    await Promise.all(userPromises);

    const user = userCache.get(data.userId)!;
    const collaborators = data.collaboratorIds?.map((id: string) => userCache.get(id)!) || [];
    
    const comments = commentsData.map((comment: any) => ({
        ...comment,
        user: userCache.get(comment.userId)!,
    }));

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

export async function processMentions(text: string, actorId: string, postId: string) {
    const mentionRegex = /@(\\w+)/g;
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
