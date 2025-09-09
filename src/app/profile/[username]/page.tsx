import { notFound } from "next/navigation";
import { getUserByUsername } from "@/services/userService";
import { getPostsByUserId, getSavedPosts, getLikedPostsByUserId } from "@/services/postService";
import { generateVibe } from "@/ai/flows/ai-profile-vibe";
import { auth } from "@/lib/firebase";
import { ProfileClientPage } from "./profile-client-page";
import type { Post } from "@/lib/types";

export default async function UserProfilePage({ params }: { params: { username: string }}) {
  const { username } = params;

  const fetchedUser = await getUserByUsername(username);

  if (!fetchedUser) {
    notFound();
  }

  // Parallelize data fetching
  const postsPromise = getPostsByUserId(fetchedUser.id);
  const vibePromise = postsPromise.then(posts => generateVibe({ captions: posts.map(p => p.caption).filter(Boolean) }));
  
  // These are only needed if viewing your own profile, but we can't know that on the server without auth state
  // This logic will be handled client-side for now to avoid complexity with server-side auth.
  // In a full server-component app, you'd get the session here.

  const [userPosts, { vibe }] = await Promise.all([
    postsPromise,
    vibePromise,
  ]);

  const initialPostCount = userPosts.length;
  
  return (
    <ProfileClientPage
      user={fetchedUser}
      initialPosts={userPosts}
      initialPostCount={initialPostCount}
      initialVibe={vibe}
    />
  );
}
