
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

async function getUserProfile(userId: string): Promise<User | null> {
  const userDocRef = adminDb.collection('users').doc(userId);
  const userDoc = await userDocRef.get();
  if (userDoc.exists) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
}

async function createUserProfile(userId: string, data: { name: string; email: string; avatar: string; }) {
    const userRef = adminDb.collection('users').doc(userId);
    const username = data.email.split('@')[0].toLowerCase() || `user${Date.now()}`;

    const newUserProfile = {
        name: data.name,
        username: username,
        email: data.email,
        avatar: data.avatar,
        bio: "Welcome to Vibespace!",
        followers: [],
        following: [],
        savedPosts: [],
        isPrivate: false,
        showActivityStatus: true,
    };
    
    await userRef.set(newUserProfile);
    return { id: userId, ...newUserProfile } as User;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, displayName, email, photoURL } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let userProfile = await getUserProfile(userId);

    if (!userProfile) {
        const nameForAvatar = displayName || email.split('@')[0];
        userProfile = await createUserProfile(userId, {
            name: displayName || "New User",
            email: email,
            avatar: photoURL || `https://ui-avatars.com/api/?name=${nameForAvatar.split(' ').join('+')}&background=random`,
        });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
