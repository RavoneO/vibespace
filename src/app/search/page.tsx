
import AppLayout from "@/components/app-layout";
import { ExploreClient } from "./explore-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function SearchPage() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90 mb-6">
            Explore
          </h1>
          <Suspense fallback={<ExplorePageSkeleton />}>
            <ExploreClient />
          </Suspense>
        </div>
      </main>
    </AppLayout>
  );
}

