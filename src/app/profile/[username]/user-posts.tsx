
"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import { TabsContent } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import { getPostsByUserId } from "@/services/postService";
import type { Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

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

export function UserPosts({ userId, setPostCount }: { userId: string, setPostCount: (count: number) => void }) {
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    
    useEffect(() => {
        async function fetchUserPosts() {
            const fetchedPosts = await getPostsByUserId(userId);
            setUserPosts(fetchedPosts);
            setPostCount(fetchedPosts.length);
        }
        fetchUserPosts();
    }, [userId, setPostCount]);

    const imagePosts = userPosts.filter(p => p.type === 'image');
    const videoPosts = userPosts.filter(p => p.type === 'video');

    return (
        <>
            <TabsContent value="posts" className="mt-0">
                {imagePosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5">
                    {imagePosts.map((post) => (
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
                ) : (
                    <div className="text-center text-muted-foreground py-24">
                        <Icons.camera className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">No posts yet</p>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="reels" className="mt-0">
                    {videoPosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5">
                        {videoPosts.map((post) => (
                        <div key={post.id} className="relative aspect-[9/16] w-full overflow-hidden group">
                            <video
                            src={post.contentUrl}
                            className="object-cover w-full h-full transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icons.reels className="h-10 w-10 text-white" />
                            </div>
                            <div className="absolute bottom-2 left-2 text-white flex items-center gap-2 text-xs font-bold bg-black/30 rounded-full px-2 py-1">
                                <div className="flex items-center gap-1">
                                    <Icons.like className="h-4 w-4 fill-white" /> {post.likes}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Icons.comment className="h-4 w-4 fill-white" /> {post.comments.length}
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center text-muted-foreground py-24">
                        <Icons.reels className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">No reels yet</p>
                    </div>
                    )}
            </TabsContent>
        </>
    );
}
