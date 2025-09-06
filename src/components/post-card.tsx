"use client";

import type { Post } from "@/lib/types";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { CommentSheet } from "./comment-sheet";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 p-4">
          <Avatar>
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5 text-sm">
            <Link href={`/profile/${post.user.username}`} className="font-semibold hover:underline">
              {post.user.name}
            </Link>
            <div className="text-muted-foreground">@{post.user.username}</div>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <Icons.more />
            <span className="sr-only">More options</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={post.contentUrl}
              alt={post.caption}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={post.dataAiHint}
            />
          </div>
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleLike} aria-label="Like post">
                    <Icons.like
                        className={cn(
                        "transition-all duration-200",
                        isLiked ? "text-red-500 fill-current" : "text-foreground/70"
                        )}
                    />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsCommentSheetOpen(true)} aria-label="Comment on post">
                    <Icons.comment className="text-foreground/70" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Share post">
                    <Icons.send className="text-foreground/70" />
                </Button>
                <Button variant="ghost" size="icon" className="ml-auto" aria-label="Bookmark post">
                    <Icons.bookmark className="text-foreground/70" />
                </Button>
            </div>
            <div className="text-sm font-medium">{likeCount.toLocaleString()} likes</div>
            <div className="text-sm text-foreground/90">
                <Link href={`/profile/${post.user.username}`} className="font-semibold hover:underline">
                    {post.user.username}
                </Link>
                <span className="ml-2">{post.caption}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag) => (
                    <Link href={`/tags/${tag.slice(1)}`} key={tag}>
                        <span className="text-sm font-medium text-accent hover:underline">
                            {tag}
                        </span>
                    </Link>
                ))}
            </div>

            <Button variant="link" size="sm" className="text-muted-foreground p-0 h-auto" onClick={() => setIsCommentSheetOpen(true)}>
                View all {post.comments.length} comments
            </Button>
        </CardFooter>
      </Card>
      <CommentSheet open={isCommentSheetOpen} onOpenChange={setIsCommentSheetOpen} post={post} />
    </>
  );
}
