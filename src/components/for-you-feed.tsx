
"use client";

import { PostCard } from "@/components/post-card";
import { AdCard } from "@/components/ad-card";
import type { Post, Ad } from '@/lib/types';
import { Icons } from './icons';

type FeedItem = (Post & { type: 'post' }) | (Ad & { type: 'ad' });

export function ForYouFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-24 px-4">
            <Icons.userSearch className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">No recommendations yet</p>
            <p className="text-sm">Like some posts to get started!.</p>
        </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map(item => {
        if (item.type === 'post') {
          return <PostCard key={item.id} post={item} />;
        }
        if (item.type === 'ad') {
          return <AdCard key={item.id} ad={item} />;
        }
        return null;
      })}
    </div>
  );
}
