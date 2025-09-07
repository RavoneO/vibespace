
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { PostCard } from "@/components/post-card";
import { Stories } from "@/components/stories";
import { Skeleton } from "@/components/ui/skeleton";
import { getPosts } from "@/services/postService";
import { getStories } from "@/services/storyService";
import type { Post, Story } from "@/lib/types";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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


export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [postsData, storiesData] = await Promise.all([
          getPosts(),
          getStories(),
        ]);
        setPosts(postsData);
        setStories(storiesData);
      } catch (err) {
        console.error("Failed to load feed data:", err);
        setError("Could not load the feed. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
