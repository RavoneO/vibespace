
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserProfile } from '@/services/userService.server';
import { getPostsForUser, getSavedPosts, getLikedPosts } from '@/services/postService.server';
import { ProfileClientPage } from './[username]/profile-client-page';
import { redirect } from 'next/navigation';
import { User } from '@/lib/types';

async function getCurrentUser(): Promise<User | null> {
  const session = cookies().get("session")?.value;
  if (!session) return null;

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    const userProfile = await getUserProfile(decodedToken.uid);
    return userProfile;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
    return null; 
  }

  // Fetch all data in parallel
  const [posts, savedPosts, likedPosts] = await Promise.all([
    getPostsForUser(user.id),
    getSavedPosts(user.id),
    getLikedPosts(user.id)
  ]);

  return (
    <ProfileClientPage 
      user={user}
      initialPosts={posts}
      initialSavedPosts={savedPosts}
      initialLikedPosts={likedPosts}
    />
  );
}
