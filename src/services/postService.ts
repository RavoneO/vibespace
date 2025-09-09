'use server';

import { db, storage } from '@/lib/firebase';
import { collection, doc, updateDoc, arrayUnion, addDoc, serverTimestamp, increment, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import type { PostTag } from '@/lib/types';
import { createActivity } from './activityService';
import { createPost as createPostServer, updatePost as updatePostServer, addComment as addCommentServer } from './postService.server';

export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    caption: string;
    hashtags: string[];
    tags?: PostTag[];
    collaboratorIds?: string[];
}) {
    return await createPostServer(postData);
}

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
    return await updatePostServer(postId, data);
}

export async function addComment(postId: string, commentData: { userId: string, text: string }) {
    await addCommentServer(postId, commentData);
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
