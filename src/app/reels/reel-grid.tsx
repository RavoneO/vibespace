
"use client";

import type { Post } from "@/lib/types";
import { Icons } from "@/components/icons";

interface ReelGridProps {
  reels: Post[];
  onReelClick: (index: number) => void;
}

export function ReelGrid({ reels, onReelClick }: ReelGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          onClick={() => onReelClick(index)}
          className="relative aspect-[9/16] w-full overflow-hidden rounded-lg group cursor-pointer"
        >
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
                <Icons.comment className="h-3 w-3 fill-white" />{" "}
                {reel.comments.length}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
