
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { CommentSheet } from "./comment-sheet";
import { useAuth } from "@/hooks/use-auth";
import { getPostById, deletePost } from "@/services/postService";
import { toggleLike, updatePost } from "@/services/postService";
import { toggleBookmark, getUserById } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "./ui/aspect-ratio";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const [isSaving, setIsSaving] = useState(false);

  const likeButtonRef = useRef<HTMLButtonElement>(null);
  
  const isProcessing = post.status === 'processing';
  const isOwner = user?.uid === post.user.id;

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
    if (isProcessing) return;
    const updatedPost = await getPostById(post.id);
    if (updatedPost) {
      setPost(updatedPost);
    }
  }, [post.id, isProcessing]);

  const showLoginToast = () => {
    toast({
        title: "Create an account to interact",
        description: "Sign up or log in to like, comment, and more.",
        variant: "destructive",
        action: <Link href="/signup"><Button>Sign Up</Button></Link>
    });
  }

  const handleLike = async () => {
    if (!user || isGuest || isProcessing) {
      if (!user || isGuest) showLoginToast();
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
      if (!user || isGuest || isProcessing) {
          if (!user || isGuest) showLoginToast();
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
    if (isProcessing) return;
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
      if (isProcessing) return;
      setIsCommentSheetOpen(true);
  }

  const handleDelete = async () => {
    if (!isOwner) return;

    setIsDeleting(true);
    try {
        await deletePost(post.id);
        toast({ title: "Post deleted successfully" });
        setIsDeleteDialogOpen(false);
        // The post will be removed from the feed by the real-time listener in `FeedPage`
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ title: "Failed to delete post", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const handleEditSave = async () => {
      if (!isOwner) return;
      setIsSaving(true);
      try {
          await updatePost(post.id, { caption: editedCaption });
          setPost(prev => ({...prev, caption: editedCaption}));
          toast({ title: "Post updated successfully" });
          setIsEditDialogOpen(false);
      } catch (error) {
          console.error("Error updating post:", error);
          toast({ title: "Failed to update post", variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  };

  const getTimestamp = (timestamp: any) => {
      if (isProcessing) return "Publishing...";
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
      <Card className={cn("overflow-hidden animate-fade-in bg-transparent border-0 border-b rounded-none shadow-none", isProcessing && "opacity-50 pointer-events-none")}>
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-auto" disabled={isProcessing}>
                        <Icons.more />
                        <span className="sr-only">More options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {isOwner && (
                        <>
                         <DropdownMenuItem onSelect={() => {
                            setEditedCaption(post.caption);
                            setIsEditDialogOpen(true);
                         }}>
                            <Icons.edit className="mr-2 h-4 w-4" />
                            Edit
                         </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuItem onSelect={() => console.log('Report')}>
                        Report
                    </DropdownMenuItem>
                    {isOwner && (
                        <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                           Delete
                        </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
        <CardContent className="px-4 py-0">
          <div className="text-sm text-foreground/90 mb-4 space-y-2">
            <p>{post.caption}</p>
            <div className="flex flex-wrap gap-x-2">
                {post.hashtags.map((tag) => (
                    <Link href={`/tags/${tag.slice(1)}`} key={tag}>
                        <span className="font-medium text-primary hover:underline">
                            {tag}
                        </span>
                    </Link>
                ))}
            </div>
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                           <span className="capitalize font-normal">{tag.label}:</span>&nbsp;<span className="font-semibold">{tag.text}</span>
                        </Badge>
                    ))}
                </div>
            )}
          </div>
          <div className="relative w-full overflow-hidden rounded-lg">
             {isProcessing ? (
                <AspectRatio ratio={1/1} className="bg-muted flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Icons.spinner className="animate-spin h-8 w-8" />
                        <span>Uploading...</span>
                    </div>
                </AspectRatio>
             ) : post.type === 'image' ? (
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
                <Button ref={likeButtonRef} variant="ghost" size="sm" onClick={handleLike} aria-label="Like post" className="flex items-center gap-2" disabled={isProcessing}>
                    <Icons.like
                        className={cn(
                        "transition-all duration-200 h-5 w-5",
                        isLiked ? "text-red-500 fill-current" : "text-foreground/70"
                        )}
                    />
                    <span className="font-medium">{likeCount.toLocaleString()}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCommentClick} aria-label="Comment on post" className="flex items-center gap-2" disabled={isProcessing}>
                    <Icons.comment className="text-foreground/70 h-5 w-5" />
                    <span className="font-medium">{post.comments.length}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share post" className="flex items-center gap-2" disabled={isProcessing}>
                    <Icons.send className="text-foreground/70 h-5 w-5" />
                </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleBookmark} className="ml-auto" aria-label="Bookmark post" disabled={isProcessing}>
                <Icons.bookmark className={cn("text-foreground/70 h-5 w-5", isBookmarked && "fill-current text-foreground")} />
            </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your post and remove its data from our servers.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Icons.spinner className="animate-spin mr-2" />}
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="min-h-[150px]"
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleEditSave} disabled={isSaving}>
                    {isSaving && <Icons.spinner className="animate-spin mr-2" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isProcessing && (
        <CommentSheet 
            open={isCommentSheetOpen} 
            onOpenChange={setIsCommentSheetOpen} 
            post={post}
            onCommentPosted={refreshPost}
        />
      )}
    </>
  );
}
