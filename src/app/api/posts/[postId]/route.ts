
// src/app/api/posts/[postId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { deletePost as deletePostService, updatePost as updatePostService, addComment as addCommentService } from '@/services/postService.server';
import { toggleLike, toggleBookmark } from '@/services/userService.server';

export async function DELETE(
  request: NextRequest,
  context: { params: { postId: string } }
) {
  try {
    const { postId } = context.params;
    const { userId } = await request.json(); // Assuming userId is sent for validation
    // TODO: Add validation to ensure the user has permission to delete the post
    await deletePostService(postId);
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(`Error deleting post ${context.params.postId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { postId: string } }
) {
    try {
        const { postId } = context.params;
        const { caption } = await request.json();
        if (typeof caption !== 'string') {
            return NextResponse.json({ error: 'Invalid caption format' }, { status: 400 });
        }
        await updatePostService(postId, { caption });
        return NextResponse.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error(`Error updating post ${context.params.postId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: { postId: string } }
  ) {
      try {
        const { postId } = context.params;
          const { action, userId, text } = await request.json();
  
          switch (action) {
              case 'like':
                  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
                  const isLiked = await toggleLike(postId, userId);
                  return NextResponse.json({ isLiked });
              case 'bookmark':
                  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
                  const isBookmarked = await toggleBookmark(userId, postId);
                  return NextResponse.json({ isBookmarked });
              case 'comment':
                  if (!userId || !text) return NextResponse.json({ error: 'Missing userId or text' }, { status: 400 });
                  const newComment = await addCommentService(postId, { userId, text });
                  return NextResponse.json(newComment);
              default:
                  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
          }
      } catch (error) {
          console.error(`Error processing action for post ${context.params.postId}:`, error);
          return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
  }
