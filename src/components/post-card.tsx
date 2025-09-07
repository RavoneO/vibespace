
"use client";

import type { Post as PostType, User } from "@/lib/types";
import { useState, useRef, useEffect, useCallback } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { getPostById } from "@/services/postService";
import { toggleLike } from "@/services/postService";
import { toggleBookmark, getUserById } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "./ui/aspect-ratio";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: PostType;
}

export function PostCard({ post: initialPost }: PostCardProps) {
  const { user, isGuest } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    async function checkBookmarkStatus() {
        if(user && !isGuest) {
            const userProfile = await getUserById(user.uid);
            setIsBookmarked(userProfile?.savedPosts?.includes(post.id) || false);
        } else {
            setIsBookmarked(false);
        }
    }
    checkBookmarkStatus();

    if (user && Array.isArray(post.likedBy)) {
      setIsLiked(post.likedBy.includes(user.uid));
    } else {
      setIsLiked(false);
    }
    setLikeCount(post.likes);
  }, [user, post, isGuest]);

  const refreshPost = useCallback(async () => {
    const updatedPost = await getPostById(post.id);
    if (updatedPost) {
      setPost(updatedPost);
    }
  }, [post.id]);

  const showLoginToast = () => {
    toast({
        title: "Create an account to interact",
        description: "Sign up or log in to like, comment, and more.",
        variant: "destructive",
        action: <Link href="/signup"><Button>Sign Up</Button></Link>
    });
  }

  const handleLike = async () => {
    if (!user || isGuest) {
      showLoginToast();
      return;
    }

    try {
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
      
      // Optimistic UI update
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
      
      if (newIsLiked) {
        likeButtonRef.current?.classList.add('animate-like');
        setTimeout(() => {
          likeButtonRef.current?.classList.remove('animate-like');
        }, 400);
      }
      
      await toggleLike(post.id, user.uid);

    } catch (error) {
      console.error("Error liking post:", error);
       setIsLiked(!isLiked);
       setLikeCount(likeCount);
       toast({
        title: "Something went wrong.",
        description: "Could not update like status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
      if (!user || isGuest) {
          showLoginToast();
          return;
      }
      const newIsBookmarked = !isBookmarked;
      setIsBookmarked(newIsBookmarked);

      try {
          await toggleBookmark(user.uid, post.id);
          toast({
              title: newIsBookmarked ? "Post saved!" : "Post unsaved",
          });
      } catch (error) {
          setIsBookmarked(!newIsBookmarked); // Revert on error
          console.error("Error bookmarking post:", error);
          toast({ title: "Something went wrong.", variant: "destructive" });
      }
  };

  const handleShare = async () => {
    if(navigator.share) {
        try {
            await navigator.share({
                title: `Check out this post by @${post.user.username}`,
                text: post.caption,
                url: window.location.href, // Or a direct link to the post
            });
        } catch (error) {
            console.error("Error sharing post", error);
        }
    } else {
        toast({
            title: "Share Not Available",
            description: "Your browser does not support the Web Share API."
        })
    }
  };
  
  const handleCommentClick = () => {
      setIsCommentSheetOpen(true);
  }

  const getTimestamp = (timestamp: any) => {
      if (!timestamp) return "";
      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true });
      } catch (e) {
          return "just now";
      }
  }

  return (
    <>
      <Card className="overflow-hidden animate-fade-in bg-transparent border-0 border-b rounded-none shadow-none">
        <CardHeader className="flex flex-row items-center gap-3 p-4">
          <Avatar>
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
            <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5 text-sm">
            <Link href={`/profile/${post.user.username}`} className="font-semibold hover:underline">
              {post.user.name}
            </Link>
            <div className="text-muted-foreground">{getTimestamp(post.timestamp)}</div>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <Icons.more />
            <span className="sr-only">More options</span>
          </Button>
        </CardHeader>
        <CardContent className="px-4 py-0">
          <div className="text-sm text-foreground/90 mb-4">
            <span>{post.caption}</span>
            <div className="flex flex-wrap gap-x-2">
                {post.hashtags.map((tag) => (
                    <Link href={`/tags/${tag.slice(1)}`} key={tag}>
                        <span className="font-medium text-primary hover:underline">
                            {tag}
                        </span>
                    </Link>
                ))}
            </div>
          </div>
          <div className="relative w-full overflow-hidden rounded-lg">
             {post.type === 'image' ? (
                <AspectRatio ratio={1 / 1}>
                    <Image
                        src={post.contentUrl}
                        alt={post.caption}
                        fill
                        className="object-cover"
                        data-ai-hint={post.dataAiHint}
                        priority
                    />
                </AspectRatio>
              ) : (
                 <AspectRatio ratio={9 / 16} className="bg-black">
                     <video
                        src={post.contentUrl}
                        controls
                        className="w-full h-full object-contain"
                        playsInline
                        loop
                        muted
                    />
                 </AspectRatio>
              )}
          </div>
        </CardContent>
        <CardFooter className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
                <Button ref={likeButtonRef} variant="ghost" size="sm" onClick={handleLike} aria-label="Like post" className="flex items-center gap-2">
                    <Icons.like
                        className={cn(
                        "transition-all duration-200 h-5 w-5",
                        isLiked ? "text-red-500 fill-current" : "text-foreground/70"
                        )}
                    />
                    <span className="font-medium">{likeCount.toLocaleString()}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCommentClick} aria-label="Comment on post" className="flex items-center gap-2">
                    <Icons.comment className="text-foreground/70 h-5 w-5" />
                    <span className="font-medium">{post.comments.length}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share post" className="flex items-center gap-2">
                    <Icons.send className="text-foreground/70 h-5 w-5" />
                </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleBookmark} className="ml-auto" aria-label="Bookmark post">
                <Icons.bookmark className={cn("text-foreground/70 h-5 w-5", isBookmarked && "fill-current text-foreground")} />
            </Button>
        </CardFooter>
      </Card>
      <CommentSheet 
        open={isCommentSheetOpen} 
        onOpenChange={setIsCommentSheetOpen} 
        post={post}
        onCommentPosted={refreshPost}
      />
    </>
  );
}
