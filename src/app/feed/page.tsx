
"use client";

import AppLayout from "@/components/app-layout";
import { ForYouFeed } from "@/components/for-you-feed";
import { Stories } from "@/components/stories";
import { Skeleton } from "@/components/ui/skeleton";
import { getStories } from "@/services/storyService.server";
import { getPosts, getPostsForUserFeed } from "@/services/postService.server";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense, useState, useEffect, useTransition } from "react";
import { getAvailableAds, selectAd } from "@/services/adService.server";
import type { Ad, Post, FeedItem } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

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
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [useNewFeed, setUseNewFeed] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchAndSetFeed() {
    setLoading(true);
    const storiesData = getStories();
    const postsData = useNewFeed && user ? getPostsForUserFeed(user.id) : getPosts();
    
    const [storiesResult, postsResult] = await Promise.all([storiesData, postsData]);

    setStories(storiesResult);

    const sponsoredPosts = postsResult.filter(p => p.isSponsored);
    const regularPosts = postsResult.filter(p => !p.isSponsored);
    const orderedPosts = [...sponsoredPosts, ...regularPosts];
    
    const items: FeedItem[] = [];
    const availableAds = await getAvailableAds();

    for(let i = 0; i < orderedPosts.length; i++) {
        items.push({ ...orderedPosts[i], type: 'post' });
        const adIndex = i + 1;
        if(adIndex % 4 === 0 && availableAds.length > 0) {
            const recentCaptions = orderedPosts.slice(Math.max(0, i - 3), i).map(p => p.caption);
            const ad = await selectAd(availableAds, recentCaptions);
            items.push({ ...ad, type: 'ad' });
        }
    }
    setFeedItems(items);
    setLoading(false);
  }

  useEffect(() => {
    fetchAndSetFeed();
  }, [useNewFeed, user]);

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchAndSetFeed();
      return;
    }
    startTransition(async () => {
      const posts = feedItems.filter(item => item.type === 'post') as Post[];
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'semantic-search', 
          payload: { query: searchQuery, posts: posts.map(({id, caption}) => ({id, caption})) }
        }),
      });
      const { sortedPostIds } = await response.json();
      const sortedPosts = sortedPostIds.map((id: string) => posts.find(p => p.id === id)).filter(Boolean) as Post[];
      
      const newFeedItems: FeedItem[] = sortedPosts.map(post => ({ ...post, type: 'post' }));
      setFeedItems(newFeedItems);
    });
  };

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <header className="grid grid-cols-[1fr_auto] items-center p-4 border-b">
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setUseNewFeed(false)} className={cn(useNewFeed && "text-muted-foreground")} >Following</Button>
                <Button variant="ghost" onClick={() => setUseNewFeed(true)} className={cn(!useNewFeed && "text-muted-foreground")} >For You</Button>
            </div>
              <Button asChild variant="ghost" size="icon">
                <Link href="/messages">
                    <Icons.send />
                    <span className="sr-only">Messages</span>
                </Link>
              </Button>
          </header>

          <div className="p-4 border-b">
            <div className="flex gap-2">
              <Input 
                type="search" 
                placeholder="Search your feed..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isPending}>
                {isPending ? <Icons.loader className="h-4 w-4 animate-spin" /> : <Icons.search />}
              </Button>
            </div>
          </div>

          <Suspense fallback={<Skeleton className="h-[125px] w-full" />}>
            <Stories stories={stories} />
          </Suspense>

          <Suspense fallback={<FeedSkeleton />}>
            {loading ? <FeedSkeleton /> : (
                 feedItems.length === 0 ? (
                    <div className="text-center text-muted-foreground py-24 px-4">
                        <Icons.home className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">Welcome to your feed!</p>
                        <p className="text-sm">Follow people to see their posts here.</p>
                        <Button asChild className="mt-4">
                            <Link href="/search">Find People to Follow</Link>
                        </Button>
                    </div>
                  ) : (
                    <ForYouFeed items={feedItems} />
                  )
            )}
          </Suspense>
      </main>
    </AppLayout>
  );
}
