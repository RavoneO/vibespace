
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AppLayout from "@/components/app-layout";
import { PostCard } from "@/components/post-card";
import { Stories } from "@/components/stories";
import { Skeleton } from "@/components/ui/skeleton";
import { getStories } from "@/services/storyService";
import { getUserById } from "@/services/userService";
import type { Post, Story, User } from "@/lib/types";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function FeedSkeleton() {
  return (
      <div className="space-y-8 px-4 py-8">
          <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                      <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                          </div>
                      </div>
                      <Skeleton className="w-full aspect-square rounded-lg" />
                  </div>
              ))}
          </div>
      </div>
  );
}

async function processPostDoc(doc: any): Promise<Post> {
    const data = doc.data();
    const user = await getUserById(data.userId);
    
    const commentsData = Array.isArray(data.comments) ? data.comments : [];
    const comments = await Promise.all(
        commentsData.map(async (comment: any) => ({
            ...comment,
            user: await getUserById(comment.userId) ?? { id: comment.userId, name: "Unknown User", username: "unknown", avatar: "", bio: "" }
        }))
    );

    return {
      id: doc.id,
      user: user ?? { id: data.userId, name: "Unknown User", username: "unknown", avatar: "", bio: "" },
      type: data.type,
      contentUrl: data.contentUrl,
      caption: data.caption,
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
      likes: data.likes || 0,
      likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
      comments,
      timestamp: data.timestamp,
      status: data.status,
      dataAiHint: data.dataAiHint,
    } as Post;
}


export default function FeedPage() {
  const { user: authUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStories() {
        try {
            const storiesData = await getStories();
            setStories(storiesData);
        } catch(err) {
            console.error("Failed to load stories:", err);
            // Non-critical, so we don't set a main error state
        }
    }
    loadStories();
  }, []);

  useEffect(() => {
    if (!authUser && !useAuth().isGuest) { // Wait for auth state to resolve
        return;
    }
    
    setLoading(true);

    const postsCollection = collection(db, 'posts');
    const q = query(
      postsCollection, 
      orderBy('timestamp', 'desc'),
      where('status', 'in', ['published', 'processing'])
    );
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        try {
            const postsData = await Promise.all(querySnapshot.docs.map(processPostDoc));
            
            // Filter posts to only show 'published' or user's own 'processing' posts
            const filteredPosts = postsData.filter(p => 
                p.status === 'published' || (p.status === 'processing' && p.user.id === authUser?.uid)
            );

            setPosts(filteredPosts);
            setError(null);
        } catch (err) {
            console.error("Failed to process posts:", err);
            setError("Could not load the feed. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, (err) => {
        console.error("Snapshot error:", err);
        setError("Could not connect to the feed. Please check your connection.");
        setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser, useAuth().isGuest]);

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <header className="flex items-center justify-between p-4 border-b">
              <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
                Vibespace
              </h1>
              <Button asChild variant="ghost" size="icon">
                <Link href="/messages">
                    <Icons.send />
                    <span className="sr-only">Messages</span>
                </Link>
              </Button>
          </header>
          <Stories stories={stories} />
           {loading ? (
             <FeedSkeleton />
           ) : error ? (
            <div className="text-center text-red-500 py-24 px-4">
              <Icons.close className="mx-auto h-12 w-12" />
              <p className="mt-4 font-semibold">Something went wrong</p>
              <p className="text-sm">{error}</p>
            </div>
           ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-24 px-4">
                <Icons.home className="mx-auto h-12 w-12" />
                <p className="mt-4 font-semibold">Welcome to your feed!</p>
                <p className="text-sm">It's looking a little empty. Create your first post or follow some friends.</p>
            </div>
           ) : (
             <div className="space-y-1">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
           )}
      </main>
    </AppLayout>
  );
}
