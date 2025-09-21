import { NextResponse } from 'next/server';
import { getBlockedUsers } from '@/services/userService.server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const blockedUsers = await getBlockedUsers(userId);
    return NextResponse.json(blockedUsers);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
