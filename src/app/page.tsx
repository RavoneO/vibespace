import AppLayout from "@/components/app-layout";
import { AdCard } from "@/components/ad-card";
import { PostCard } from "@/components/post-card";
import { posts } from "@/lib/data";

export default function Home() {
  const feedItems = [...posts];
  // Insert an ad after the second post
  if (feedItems.length > 2) {
    feedItems.splice(2, 0, { id: "ad1", type: "ad" } as any);
  } else {
    feedItems.push({ id: "ad1", type: "ad" } as any);
  }

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Feed</h1>
          {feedItems.map((item) =>
            item.type === 'ad' ? <AdCard key={item.id} /> : <PostCard key={item.id} post={item} />
          )}
        </div>
      </main>
    </AppLayout>
  );
}
