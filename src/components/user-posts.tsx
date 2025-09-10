"use client"
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import type { Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PostGrid } from "./post-grid";

export function PostGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5 mt-0">
        {[...Array(9)].map((_, i) => (
            <div key={i} className="relative aspect-square w-full overflow-hidden">
                <Skeleton className="w-full h-full" />
            </div>
        ))}
    </div>
  )
}

export function UserPosts({ posts }: { posts: Post[] }) {

    const imagePosts = posts.filter(p => p.type === 'image');
    const videoPosts = posts.filter(p => p.type === 'video');

    return (
        <>
            <TabsContent value="posts" className="mt-0">
                <PostGrid 
                    posts={imagePosts}
                    noPostsMessage={{
                        icon: Icons.camera,
                        title: "No posts yet",
                        text: "Share your first photo!"
                    }}
                />
            </TabsContent>
            <TabsContent value="reels" className="mt-0">
                <PostGrid 
                    posts={videoPosts}
                    noPostsMessage={{
                        icon: Icons.reels,
                        title: "No reels yet",
                        text: "Share your first video!"
                    }}
                />
            </TabsContent>
        </>
    );
}
