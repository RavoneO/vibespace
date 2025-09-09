
import { NextResponse } from 'next/server';
import { createPost as createPostService } from '@/services/postService.server';

export async function POST(request: Request) {
  try {
    const postData = await request.json();
    const { userId, type, caption, hashtags, tags, collaboratorIds } = postData;

    // TODO: Add user validation here to ensure the user is who they say they are.
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = await createPostService({
        userId,
        type,
        caption,
        hashtags,
        tags,
        collaboratorIds
    });
    
    return NextResponse.json({ postId });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
