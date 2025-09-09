// src/app/api/posts/[postId]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { deletePost as deletePostService, updatePost as updatePostService, addComment as addCommentService } from '@/services/postService.server';

export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    await deletePostService(params.postId);
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(`Error deleting post ${params.postId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { postId: string } }
) {
    try {
        const { caption } = await request.json();
        if (typeof caption !== 'string') {
            return NextResponse.json({ error: 'Invalid caption format' }, { status: 400 });
        }
        await updatePostService(params.postId, { caption });
        return NextResponse.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error(`Error updating post ${params.postId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
    try {
        const { userId, text } = await request.json();
        if (!userId || !text) {
            return NextResponse.json({ error: 'Missing userId or text' }, { status: 400 });
        }
        await addCommentService(params.postId, { userId, text });
        return NextResponse.json({ message: 'Comment added successfully' });
    } catch (error) {
        console.error(`Error adding comment to post ${params.postId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
