
"use client";

import { useState } from "react";
import type { Post } from "@/lib/types";
import { ReelGrid } from "./reel-grid";
import { ReelViewer } from "@/components/reel-viewer";

export function ReelsClient({ initialReels }: { initialReels: Post[] }) {
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
