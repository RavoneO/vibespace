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
import type { Post } from "@/lib/types";
import { Icons } from "./icons";
import { Separator } from "./ui/separator";
import { currentUser } from "@/lib/data";

interface CommentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}

export function CommentSheet({ open, onOpenChange, post }: CommentSheetProps) {
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
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p>
                    <span className="font-semibold">{comment.user.username}</span>
                    <span className="ml-2 text-muted-foreground">{comment.timestamp}</span>
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
            <form className="flex w-full items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input placeholder="Add a comment..." className="flex-1" />
                <Button type="submit" size="icon">
                    <Icons.send className="h-4 w-4" />
                    <span className="sr-only">Post comment</span>
                </Button>
            </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
