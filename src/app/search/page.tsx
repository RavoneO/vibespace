
import AppLayout from "@/components/app-layout";
import { ExploreClient } from "./explore-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPosts } from "@/services/postService.server";
import type { Post } from "@/lib/types";

function ExplorePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
         <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="relative aspect-square w-full overflow-hidden">
                    <Skeleton className="w-full h-full" />
                </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// This is now a Server Component
export default async function SearchPage() {
  // Fetch initial explore posts on the server
  const posts = await getPosts();
  // Shuffle posts for a more dynamic explore feed
  const explorePosts = posts.sort(() => 0.5 - Math.random());

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90 mb-6">
            Explore
          </h1>
          <Suspense fallback={<ExplorePageSkeleton />}>
            <ExploreClient initialExplorePosts={explorePosts} />
          </Suspense>
        </div>
      </main>
    </AppLayout>
  );
}
