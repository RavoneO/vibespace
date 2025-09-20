import { NextRequest, NextResponse } from 'next/server';
import { deletePost as deletePostService, updatePost as updatePostService, addComment as addCommentService } from '@/services/postService.server';
import { toggleLike, toggleBookmark } from '@/services/userService.server';

interface RouteContext {
  params: {
    postId: string;
  };
}

// DELETE a post
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { postId } = params;
    // TODO: Add validation to ensure the user has permission to delete the post
    await deletePostService(postId);
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(`Error deleting post:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH a post (e.g., update caption)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { postId } = params;
    const { caption } = await req.json();
    if (typeof caption !== 'string') {
      return NextResponse.json({ error: 'Invalid caption' }, { status: 400 });
    }
    await updatePostService(postId, { caption });
    return NextResponse.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error(`Error updating post:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST to a post (like, bookmark, comment)
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { postId } = params;
    const { action, userId, text } = await req.json();

    switch (action) {
      case 'like':
        if (!userId) return new Response('Missing userId', { status: 400 });
        const isLiked = await toggleLike(postId, userId);
        return NextResponse.json({ isLiked });

      case 'bookmark':
        if (!userId) return new Response('Missing userId', { status: 400 });
        const isBookmarked = await toggleBookmark(userId, postId);
        return NextResponse.json({ isBookmarked });

      case 'comment':
        if (!userId || !text) return new Response('Missing userId or text', { status: 400 });
        try {
            const newComment = await addCommentService(postId, { userId, text });
            return NextResponse.json(newComment);
        } catch (error: any) {
            // This is a specific check for our content moderation flow
            if (error.message.includes('harmful')) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
            throw error;
        }

      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error(`Error in POST request:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
