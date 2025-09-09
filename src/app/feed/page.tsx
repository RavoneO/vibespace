
import AppLayout from "@/components/app-layout";
import { PostCard } from "@/components/post-card";
import { Stories } from "@/components/stories";
import { Skeleton } from "@/components/ui/skeleton";
import { getStories } from "@/services/storyService";
import { getPosts } from "@/services/postService";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdCard } from "@/components/ad-card";
import { Suspense } from "react";
import { getAvailableAds, selectAd } from "@/services/adService";
import type { Ad } from "@/services/adService";

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

// This is now a Server Component
export default async function FeedPage() {
  // Fetch data on the server
  const storiesData = getStories();
  const postsData = getPosts();
  
  const [stories, posts] = await Promise.all([storiesData, postsData]);

  // Inject ads into the feed on the server
  const postsWithAds: (any)[] = [];
  const availableAds = getAvailableAds();

  for(let i = 0; i < posts.length; i++) {
    postsWithAds.push(posts[i]);
    const adIndex = i + 1;
    if(adIndex % 4 === 0 && availableAds.length > 0) {
      // Ad selection logic remains, but it's now called from a client-compatible service
      const recentCaptions = posts.slice(Math.max(0, i - 3), i).map(p => p.caption);
      const ad = await selectAd(availableAds, recentCaptions);
      postsWithAds.push({ type: 'ad', ad });
    }
  }


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

          <Suspense fallback={<Skeleton className="h-[125px] w-full" />}>
            <Stories stories={stories} />
          </Suspense>

          <Suspense fallback={<FeedSkeleton />}>
            {postsWithAds.length === 0 ? (
              <div className="text-center text-muted-foreground py-24 px-4">
                  <Icons.home className="mx-auto h-12 w-12" />
                  <p className="mt-4 font-semibold">Welcome to your feed!</p>
                  <p className="text-sm">Follow people to see their posts here.</p>
                  <Button asChild className="mt-4">
                      <Link href="/search">Find People to Follow</Link>
                  </Button>
              </div>
            ) : (
              <div className="space-y-1">
                  {postsWithAds.map((item, index) => {
                    if (item.type === 'ad') {
                      return <AdCard key={`ad-${index}`} ad={item.ad} />;
                    }
                    return <PostCard key={item.id} post={item} />
                  })}
                </div>
            )}
          </Suspense>
      </main>
    </AppLayout>
  );
}
