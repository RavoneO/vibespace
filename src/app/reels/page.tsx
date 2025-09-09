
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { getReels } from "@/services/postService";
import type { Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ReelViewer } from "@/components/reel-viewer";

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  useEffect(() => {
    async function loadReels() {
        setLoading(true);
        const videoPosts = await getReels();
        setReels(videoPosts);
        setLoading(false);
    }
    loadReels();
  }, []);

  const openReelViewer = (index: number) => {
    setSelectedReelIndex(index);
    setViewerOpen(true);
  };

  const closeReelViewer = () => {
    setViewerOpen(false);
  };

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
        {loading ? (
            <ReelsSkeleton />
        ) : reels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {reels.map((reel, index) => (
                <div key={reel.id} onClick={() => openReelViewer(index)} className="relative aspect-[9/16] w-full overflow-hidden rounded-lg group cursor-pointer">
                  <video
                    src={reel.contentUrl}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    playsInline
                    loop
                    muted
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-2 text-white">
                    <p className="text-sm font-semibold truncate">
                      {reel.user.username}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <Icons.like className="h-3 w-3 fill-white" /> {reel.likes}
                        </div>
                        <div className="flex items-center gap-1">
                            <Icons.comment className="h-3 w-3 fill-white" /> {reel.comments.length}
                        </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-4">
            <Icons.reels className="mx-auto h-16 w-16" />
            <h2 className="mt-4 text-xl font-bold">No Reels Yet</h2>
            <p className="mt-1 text-sm">Upload your first reel to get started.</p>
          </div>
        )}
      </main>
       {viewerOpen && (
        <ReelViewer
          reels={reels}
          initialReelIndex={selectedReelIndex}
          onClose={closeReelViewer}
        />
      )}
    </AppLayout>
  );
}
