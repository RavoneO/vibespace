
import { NextResponse } from 'next/server';
import { findOrCreateConversation } from '@/services/messageService.server';

export async function POST(request: Request) {
  try {
    const { currentUserId, targetUserId } = await request.json();

    if (!currentUserId || !targetUserId) {
      return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 });
    }

    const conversationId = await findOrCreateConversation(currentUserId, targetUserId);
    
    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error('Error finding or creating conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
