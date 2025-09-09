
import AppLayout from "@/components/app-layout";
import { SearchClient } from "./search-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function SearchPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
         <div className="flex flex-col gap-4">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                    </div>
                </div>
            ))}
          </div>
      </div>
       <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
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
            Search
          </h1>
          <Suspense fallback={<SearchPageSkeleton />}>
            <SearchClient />
          </Suspense>
        </div>
      </main>
    </AppLayout>
  );
}
