
'use client';

import { addComment as addCommentServer, likePost as likePostServer, unlikePost as unlikePostServer, updatePost as updatePostServer } from './postService.server';

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed', dataAiHint?: string }>) {
    try {
        await updatePostServer(postId, data);
    } catch (error) {
        console.error('Failed to update post:', error);
        throw new Error('Could not update the post.');
    }
}

// This is a client-side function that securely calls the server action to create a post.
import type { PostTag } from '@/lib/types';

export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    caption: string;
    hashtags: string[];
    tags?: PostTag[];
    collaboratorIds?: string[];
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
