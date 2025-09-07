
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Post, User, Comment } from "@/lib/types";
import { Icons } from "./icons";
import { Separator } from "./ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { addComment } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { getUserById } from "@/services/userService";
import { formatDistanceToNowStrict } from "date-fns";


interface CommentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onCommentPosted: () => void;
}

export function CommentSheet({ open, onOpenChange, post, onCommentPosted }: CommentSheetProps) {
  const { user: authUser, isGuest } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commenterProfile, setCommenterProfile] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCommenterProfile = async () => {
        if (authUser && !isGuest) {
            const profile = await getUserById(authUser.uid);
            setCommenterProfile(profile);
        }
    }
    fetchCommenterProfile();
  }, [authUser, isGuest])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || isGuest) {
      toast({ 
        title: "Please log in to comment.", 
        variant: "destructive",
        action: <Link href="/signup"><Button>Sign Up</Button></Link>
      });
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(post.id, {
        userId: authUser.uid,
        text: commentText,
      });
      setCommentText("");
      onCommentPosted(); // This triggers the refresh in PostCard
      toast({ title: "Comment posted!" });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Failed to post comment",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCommentTimestamp = (comment: Comment) => {
    if (!comment.timestamp) return "";
    try {
        const date = (comment.timestamp as any).toDate ? (comment.timestamp as any).toDate() : new Date(comment.timestamp as string);
        return formatDistanceToNowStrict(date, { addSuffix: true });
    } catch (e) {
        return "just now";
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>Comments</SheetTitle>
          <SheetDescription>
            Comments on post by @{post.user.username}
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 -mx-6">
          <div className="px-6 space-y-6 py-4">
            {post.comments.sort((a,b) => (b.timestamp as any)?.seconds - (a.timestamp as any)?.seconds).map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p>
                    <Link href={`/profile/${comment.user.username}`} className="font-semibold hover:underline">{comment.user.username}</Link>
                    <span className="ml-2 text-muted-foreground">{getCommentTimestamp(comment)}</span>
                  </p>
                  <p className="text-foreground/90">{comment.text}</p>
                </div>
              </div>
            ))}
             {post.comments.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <Icons.comment className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No comments yet</p>
                    <p className="text-sm">Be the first to share what you think!</p>
                </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="mt-auto">
            <form className="flex w-full items-center gap-2" onSubmit={handleSubmit}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={commenterProfile?.avatar} />
                  <AvatarFallback>{isGuest ? 'G' : commenterProfile?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <Input 
                  placeholder="Add a comment..." 
                  className="flex-1"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting || isGuest}
                />
                <Button type="submit" size="icon" disabled={isSubmitting || isGuest || !commentText.trim()}>
                    {isSubmitting ? <Icons.spinner className="h-4 w-4 animate-spin" /> : <Icons.send className="h-4 w-4" />}
                    <span className="sr-only">Post comment</span>
                </Button>
            </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
