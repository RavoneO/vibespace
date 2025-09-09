
import AppLayout from "@/components/app-layout";
import { getPostsByHashtag } from "@/services/postService.server";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function TagPageSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-0.5">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="relative aspect-square w-full overflow-hidden">
                    <Skeleton className="w-full h-full" />
                </div>
            ))}
        </div>
    );
}

export default async function TagPage({ params }: { params: { tag: string } }) {
    const { tag } = params;
    const posts = await getPostsByHashtag(tag);

    return (
        <AppLayout>
            <main className="flex-1 overflow-y-auto">
                <header className="flex items-center p-4 border-b">
                    <Button asChild variant="ghost" size="icon">
                      <Link href="/feed">
                        <Icons.back />
                        <span className="sr-only">Back to feed</span>
                      </Link>
                    </Button>
                    <div className="text-center mx-auto">
                        <h1 className="text-xl font-bold tracking-tight text-foreground/90">
                           #{tag}
                        </h1>
                        <p className="text-sm text-muted-foreground">{posts.length} posts</p>
                    </div>
                    <div className="w-9"></div> {/* Spacer */}
                </header>

                {posts.length === 0 ? (
                     <div className="text-center text-muted-foreground py-24">
                        <Icons.search className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">No posts found</p>
                        <p className="text-sm">There are no posts with the tag #{tag} yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-0.5 mt-4">
                        {posts.map((post) => (
                           <div key={post.id} className="relative aspect-square w-full overflow-hidden group">
                                <Image
                                    src={post.contentUrl}
                                    alt={post.caption}
                                    fill
                                    className="object-cover transition-all duration-300 group-hover:opacity-80"
                                    data-ai-hint={post.dataAiHint}
                                />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                                    <div className="flex items-center gap-1 font-bold text-sm">
                                        <Icons.like className="h-5 w-5 fill-white" /> {post.likes}
                                    </div>
                                    <div className="flex items-center gap-1 font-bold text-sm">
                                        <Icons.comment className="h-5 w-5 fill-white" /> {post.comments.length}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </AppLayout>
    );
}
