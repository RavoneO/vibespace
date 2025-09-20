
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function ConversationListSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Messages</h1>
          <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-2">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
              </div>
          </div>
      ))}
    </div>
  );
}

function ConversationItem({ convo, authUserId }: { convo: Conversation, authUserId: string | undefined }) {
    const otherUser = !convo.isGroup ? convo.users.find((u) => u.id !== authUserId) : null;
    
    const name = convo.isGroup ? convo.groupName : otherUser?.name;
    const avatar = convo.isGroup ? convo.groupAvatar : otherUser?.avatar;

    if (!name) return null; // Should not happen if data is correct

    const isActive = Math.random() > 0.5; // Mocking active status

    return (
        <Link href={`/messages/chat?id=${convo.id}`} className="block hover:bg-muted/50">
            <div className="flex items-center gap-4 p-4">
                <div className="relative">
                    <Avatar className="h-14 w-14">
                       {avatar ? <AvatarImage src={avatar} /> : 
                          <AvatarFallback>
                            {convo.isGroup ? <Icons.users className="h-6 w-6" /> : name.charAt(0)}
                          </AvatarFallback>}
                    </Avatar>
                    {/* {isActive && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                    )} */}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className={cn("font-semibold truncate", isActive && "text-primary")}>{name}</p>
                        {convo.lastMessage?.timestamp && (
                             <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date((convo.lastMessage.timestamp as any).seconds * 1000), { addSuffix: true })}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate">
                            {convo.lastMessage?.text || "No messages yet."}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export function ConversationList({ initialConversations }: { initialConversations: Conversation[] }) {
  const { user: authUser, isGuest } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(initialConversations);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setConversations(initialConversations);
    setFilteredConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const results = conversations.filter(convo => {
        if (convo.isGroup) {
            return convo.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        const otherUser = convo.users.find(u => u.id !== authUser?.uid);
        return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) || otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredConversations(results);
  }, [searchQuery, conversations, authUser]);


  if (loading) {
    return <ConversationListSkeleton />;
  }
  
  if (isGuest) {
      return (
          <div className="text-center text-muted-foreground py-24 px-4">
            <Icons.messages className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">Messages are for users only</p>
            <p className="text-sm">Sign up or log in to start a conversation.</p>
            <Button asChild className="mt-4">
                <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="p-4">
        <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 bg-muted border-none" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
            filteredConversations.map((convo) => <ConversationItem key={convo.id} convo={convo} authUserId={authUser?.uid} />)
        ) : (
          <div className="text-center text-muted-foreground py-24 px-4">
            <Icons.messages className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">No Conversations</p>
            <p className="text-sm">Your conversations will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
