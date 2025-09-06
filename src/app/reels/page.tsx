import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { posts } from "@/lib/data";
import Image from "next/image";

export default function ReelsPage() {
  // For now, we'll just show some video-like posts.
  // In a real app, you'd fetch actual reels.
  const reels = posts.filter((p, i) => i % 2 !== 0);

  return (
    <AppLayout>
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
          Reels
        </h1>
        <Button asChild>
          <Link href="/reels/upload">
            <Icons.create className="mr-2" />
            Upload Reel
          </Link>
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {reels.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reels.map((reel) => (
              <Link href="#" key={reel.id}>
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg group cursor-pointer">
                  <Image
                    src={reel.contentUrl}
                    alt={reel.caption}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={reel.dataAiHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-2 text-white">
                    <p className="text-sm font-semibold truncate">
                      {reel.caption}
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Icons.reels className="mx-auto h-16 w-16" />
            <h2 className="mt-4 text-xl font-bold">No Reels Yet</h2>
            <p className="mt-1 text-sm">Upload your first reel to get started.</p>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
