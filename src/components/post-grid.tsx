"use client"

import Image from "next/image";
import type { Post } from "@/lib/types";
import { Icons } from "@/components/icons";

interface PostGridProps {
    posts: Post[];
    noPostsMessage?: {
        icon: React.ElementType;
        title: string;
        text: string;
    }
}

export function PostGrid({ posts, noPostsMessage }: PostGridProps) {
    if (posts.length === 0 && noPostsMessage) {
        const Icon = noPostsMessage.icon;
        return (
            <div className="text-center text-muted-foreground py-24">
                <Icon className="mx-auto h-12 w-12" />
                <p className="mt-4 font-semibold">{noPostsMessage.title}</p>
                <p className="text-sm">{noPostsMessage.text}</p>
            </div>
        )
    }

    if (posts.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
                <div key={post.id} className="relative aspect-square w-full overflow-hidden group">
                    {post.type === 'image' ? (
                         <Image
                            src={post.contentUrl}
                            alt={post.caption}
                            fill
                            className="object-cover transition-all duration-300 group-hover:opacity-80"
                            data-ai-hint={post.dataAiHint}
                        />
                    ) : (
                        <video
                            src={post.contentUrl}
                            className="object-cover w-full h-full transition-all duration-300"
                        />
                    )}
                   
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
    )
}
