
'use server';

import { 
    createPost as createPostServer,
    updatePost as updatePostServer,
    addComment as addCommentServer,
    deletePost as deletePostServer,
    toggleLike as toggleLikeServer,
    getPostById as getPostByIdServer
} from './postService.server';
import type { PostTag } from '@/lib/types';

export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    caption: string;
    hashtags: string[];
    tags?: PostTag[];
    collaboratorIds?: string[];
}) {
    return createPostServer(postData);
}

export async function updatePost(postId: string, data: Partial<{ caption: string, contentUrl: string, status: 'published' | 'failed' }>) {
    return updatePostServer(postId, data);
}

export async function addComment(postId: string, commentData: { userId: string, text: string }) {
    return addCommentServer(postId, commentData);
}

export async function deletePost(postId: string) {
  return deletePostServer(postId);
}

export async function toggleLike(postId: string, userId:string) {
    return toggleLikeServer(postId, userId);
}

export async function getPostById(postId: string) {
    return getPostByIdServer(postId);
}
