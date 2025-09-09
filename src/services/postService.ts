
'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Post, PostTag } from '@/lib/types';


// This is a client-side function to create a post shell in Firestore
// The actual file upload and status update happens via background server logic.
export async function createPost(postData: {
    userId: string;
    type: 'image' | 'video';
    caption: string;
    hashtags: string[];
    tags?: PostTag[];
    collaboratorIds?: string[];
}) {
    // This calls our new API route to handle post creation securely.
    const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });

    if (!response.ok) {
        throw new Error("Failed to create post");
    }
    
    const { postId } = await response.json();
    return postId;
}


// This should also be an API call to ensure security and proper handling
export async function updatePost(postId: string, data: Partial<{ contentUrl: string, status: 'published' | 'failed' }>) {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, data);
}

export async function getPostById(postId: string): Promise<Post | null> {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
        return null;
    }
    // Note: This is a simplified client-side fetch. It won't have the rich `user` object
    // that the server-side version has. For that, you need to call a dedicated API route.
    return { id: postDoc.id, ...postDoc.data() } as Post;
}
