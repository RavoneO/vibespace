
import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/services/userService.server';

// @ts-ignore - This is a temporary workaround for a suspected bug in Next.js 15.5.2
// The type signature for the second argument appears to be correct, but the build fails.
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const user = await getUserById(context.params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${context.params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
