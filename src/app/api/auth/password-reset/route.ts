
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
      const user = await adminAuth.getUserByEmail(email);
      const resetLink = await adminAuth.generatePasswordResetLink(email);

      // In a real application, you would email this link to the user.
      // For this example, we'll return it in the response for testing.
      return NextResponse.json({ 
        message: 'Password reset link generated.', 
        resetLink: resetLink 
      });

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // To prevent email enumeration, we don't reveal if the user exists or not.
        // We still return a success message.
        return NextResponse.json({ message: 'If this email is registered, a password reset link has been sent.' });
      } else {
        console.error('Password reset error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
