'use client';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post, PostTag } from '@/lib/types';
import { addComment as addCommentServer, likePost as likePostServer, unlikePost as unlikePostServer } from './postService.server';

// This is a client-side function that securely calls the server action to create a post.
export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    caption: string;
    hashtags: string[];
    tags?: PostTag[];
    collaboratorIds?: string[];
    isReel?: boolean;
}) {
    const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Failed to create post' }));
        throw new Error(errorBody.error);
    }
    
    const { postId } = await response.json();
    return postId;
}

// Client-side function to securely like a post via a server action.
export async function likePost(postId: string, userId: string) {
    try {
        await likePostServer(postId, userId);
    } catch (error) {
        console.error('Failed to like post:', error);
        // Here, you might want to show a toast to the user.
        throw new Error('Could not like the post.');
    }
}

// Client-side function to securely unlike a post via a server action.
export async function unlikePost(postId: string, userId: string) {
    try {
        await unlikePostServer(postId, userId);
    } catch (error) {
        console.error('Failed to unlike post:', error);
        // Optionally, show a toast to the user.
        throw new Error('Could not unlike the post.');
    }
}

// Client-side function to securely add a comment via a server action.
export async function addComment(postId: string, comment: { userId: string, text: string }) {
    try {
        const newComment = await addCommentServer(postId, comment);
        return newComment;
    } catch (error) {
        console.error('Failed to add comment:', error);
        // Optionally, show a toast to the user.
        throw new Error('Could not add the comment.');
    }
}

export async function getPostById(postId: string): Promise<Post | null> {
  if (!postId) return null;
  try {
    const postDocRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postDocRef);
    if (postDoc.exists()) {
      return { id: postDoc.id, ...postDoc.data() } as Post;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching post by ID (${postId}):`, error);
    return null;
  }
}

export async function updatePost(postId: string, data: Partial<Post>) {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, data);
    } catch (error) {
        console.error(`Error updating post (${postId}):`, error);
        throw new Error('Failed to update post.');
    }
}
