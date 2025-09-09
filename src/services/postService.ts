
import { db, storage } from '@/lib/firebase';
import { collection, doc, updateDoc, arrayUnion, addDoc, serverTimestamp, increment, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import type { PostTag } from '@/lib/types';
import { createActivity } from './activityService';
import { analyzeContent } from '@/ai/flows/ai-content-analyzer';

// This function is defined and exported in postService.server.ts and called from the server-side addComment implementation there.
// We will call it from our client implementation as well.
async function processMentionsOnServer(text: string, actorId: string, postId: string) {
    const { processMentions } = await import('./postService.server');
    return processMentions(text, actorId, postId);
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

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
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
                await processMentionsOnServer(postData.caption, postData.userId, postId);
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
        await processMentionsOnServer(commentData.text, commentData.userId, postId);

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
    
    const postData = postDoc.data();
    
    // Delete media from Cloud Storage
    if (postData.contentUrl) {
      try {
        const fileRef = ref(storage, postData.contentUrl);
        await deleteObject(fileRef);
      } catch (storageError: any) {
        // It's okay if the object doesn't exist, it might have been deleted already or failed to upload.
        if (storageError.code !== 'storage/object-not-found') {
          console.error("Error deleting file from storage:", storageError);
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
