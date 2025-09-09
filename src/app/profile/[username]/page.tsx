import { notFound } from "next/navigation";
import { getUserByUsername } from "@/services/userService.server";
import { getPostsByUserId, getSavedPosts, getLikedPostsByUserId } from "@/services/postService.server";
import { generateVibe } from "@/ai/flows/ai-profile-vibe";
import { ProfileClientPage } from "./profile-client-page";
import type { Post } from "@/lib/types";

export default async function UserProfilePage({ params }: { params: { username: string }}) {
  const { username } = params;

  const fetchedUser = await getUserByUsername(username);

  if (!fetchedUser) {
    notFound();
  }

  // --- Start Parallel Data Fetching ---
  
  // 1. Fetch the user's own posts
  const postsPromise = getPostsByUserId(fetchedUser.id);
  
  // 2. Generate the user's "vibe" based on their posts
  const vibePromise = postsPromise.then(posts => 
    generateVibe({ captions: posts.map(p => p.caption).filter(Boolean) })
  );

  // 3. Fetch saved and liked posts
  // In a real app, you'd get the current authenticated user's ID from the session.
  // For now, we'll assume we can't see another user's saved/liked posts.
  // This logic is simplified for this context but showcases parallel fetching.
  const savedPostsPromise = getSavedPosts(fetchedUser.savedPosts || []);
  const likedPostsPromise = getLikedPostsByUserId(fetchedUser.id);

  // Await all fetches concurrently
  const [
    userPosts, 
    { vibe }, 
    savedPosts,
    likedPosts
  ] = await Promise.all([
    postsPromise,
    vibePromise,
    savedPostsPromise,
    likedPostsPromise,
  ]);
  // --- End Parallel Data Fetching ---

  return (
    <ProfileClientPage
      user={fetchedUser}
      initialPosts={userPosts}
      initialVibe={vibe}
      initialSavedPosts={savedPosts}
      initialLikedPosts={likedPosts}
    />
  );
}
