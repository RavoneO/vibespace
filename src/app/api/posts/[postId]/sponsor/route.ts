
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { processSponsorship } from '@/services/paymentService.server';
import { getPostById } from '@/services/postService.server';

export async function POST(request: Request, { params }: any) {
  try {
    const { postId } = params;
    const { userId } = await request.json();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const postRef = adminDb.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return new NextResponse('Post not found', { status: 404 });
    }

    const post = postDoc.data();

    if (!post) {
        return new NextResponse('Post data not found', { status: 404 });
    }

    if (post.user.id !== userId) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Process a one-time payment of $5.00 (500 cents)
    await processSponsorship(userId, postId, 500);

    await postRef.update({ isSponsored: true });

    const updatedPost = await getPostById(postId);

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error sponsoring post:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
