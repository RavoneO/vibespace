
"use client";

import { useEffect, useState, Suspense } from "react";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { getReels } from "@/services/postService.server";
import type { Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ReelViewer } from "@/components/reel-viewer";
import { ReelGrid } from "./reel-grid";

function ReelsPageClient({ initialReels }: { initialReels: Post[] }) {
  const [reels, setReels] = useState<Post[]>(initialReels);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  const openReelViewer = (index: number) => {
    setSelectedReelIndex(index);
    setViewerOpen(true);
  };

  const closeReelViewer = () => {
    setViewerOpen(false);
  };

  return (
    <>
      <ReelGrid reels={reels} onReelClick={openReelViewer} />
      {viewerOpen && (
        <ReelViewer
          reels={reels}
          initialReelIndex={selectedReelIndex}
          onClose={closeReelViewer}
        />
      )}
    </>
  );
}

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

export default function ReelsPage() {
    const [reels, setReels] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getReels().then(data => {
            setReels(data);
            setLoading(false);
        });
    }, []);

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
            <Suspense fallback={<ReelsSkeleton />}>
                {loading ? <ReelsSkeleton /> : reels.length > 0 ? (
                    <ReelsPageClient initialReels={reels} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-4">
                        <Icons.reels className="mx-auto h-16 w-16" />
                        <h2 className="mt-4 text-xl font-bold">No Reels Yet</h2>
                        <p className="mt-1 text-sm">Upload your first reel to get started.</p>
                    </div>
                )}
            </Suspense>
          </main>
        </AppLayout>
      );
}
