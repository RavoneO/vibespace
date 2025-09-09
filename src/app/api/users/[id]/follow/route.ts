import { NextResponse } from 'next/server';
import { toggleFollow as toggleFollowService } from '@/services/userService.server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { currentUserId } = await request.json();
    if (!currentUserId) {
        return NextResponse.json({ error: 'currentUserId is required' }, { status: 400 });
    }
    
    const isFollowing = await toggleFollowService(currentUserId, params.id);
    
    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error(`Error toggling follow for user ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
