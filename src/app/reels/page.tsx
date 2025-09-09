

import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { getReels } from "@/services/postService.server";
import { Skeleton } from "@/components/ui/skeleton";
import { ReelsClient } from "./reels-client";

function ReelsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {[...Array(8)].map((_, i) => (
                 <div key={i} className="relative aspect-[9/16] w-full overflow-hidden rounded-lg">
                    <Skeleton className="w-full h-full" />
                </div>
            ))}
        </div>
    )
}

export default async function ReelsPage() {
    const reels = await getReels();

    return (
        <AppLayout>
          <header className="flex items-center justify-between p-4 border-b">
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
              Reels
            </h1>
            <Button asChild>
              <Link href="/create">
                <Icons.create className="mr-2" />
                Upload Reel
              </Link>
            </Button>
          </header>
          <main className="flex-1 overflow-y-auto">
             {reels.length > 0 ? (
                <ReelsClient initialReels={reels} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-4">
                    <Icons.reels className="mx-auto h-16 w-16" />
                    <h2 className="mt-4 text-xl font-bold">No Reels Yet</h2>
                    <p className="mt-1 text-sm">Upload your first reel to get started.</p>
                </div>
            )}
          </main>
        </AppLayout>
      );
}
