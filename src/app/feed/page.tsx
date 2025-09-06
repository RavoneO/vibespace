
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { PostCard } from "@/components/post-card";
import { Stories } from "@/components/stories";
import { Skeleton } from "@/components/ui/skeleton";
import { getPosts } from "@/services/postService";
import { getStories } from "@/services/storyService";
import type { Post, Story } from "@/lib/types";

function FeedSkeleton() {
  return (
      <div className="max-w-2xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pb-8">
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
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-full" />
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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [postsData, storiesData] = await Promise.all([
        getPosts(),
        getStories(),
      ]);
      setPosts(postsData);
      setStories(storiesData);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <Stories stories={stories} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90 px-4 sm:px-6 lg:px-8">Feed</h1>
           {loading ? (
             <FeedSkeleton />
           ) : (
             <div className="space-y-8 px-4 sm:px-6 lg:px-8 pb-8">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
           )}
        </div>
      </main>
    </AppLayout>
  );
}
