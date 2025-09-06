
import AppLayout from "@/components/app-layout";
import { PostCard } from "@/components/post-card";
import { Stories } from "@/components/stories";
import { posts, stories } from "@/lib/data";

export default function Home() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <Stories stories={stories} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90 px-4 sm:px-6 lg:px-8">Feed</h1>
          <div className="space-y-8 px-4 sm:px-6 lg:px-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
