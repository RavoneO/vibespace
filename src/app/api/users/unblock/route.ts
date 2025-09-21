import { NextResponse } from 'next/server';
import { unblockUser } from '@/services/userService.server';

export async function POST(request: Request) {
  try {
    const { currentUserId, userIdToUnblock } = await request.json();

    if (!currentUserId || !userIdToUnblock) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await unblockUser(currentUserId, userIdToUnblock);

    return new NextResponse(null, { status: 204 }); // 204 No Content for successful unblock
  } catch (error) {
    console.error("Error unblocking user:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
