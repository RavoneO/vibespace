import AppLayout from "@/components/app-layout";
import { PostCard } from "@/components/post-card";
import { posts } from "@/lib/data";

export default function Home() {
  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Feed</h1>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
