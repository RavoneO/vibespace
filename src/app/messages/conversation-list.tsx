
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getConversations } from "@/services/messageService.server";
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
    const otherUser = convo.users.find((u) => u.id !== authUserId);
    if (!otherUser) return null;

    const isActive = Math.random() > 0.5; // Mocking active status

    return (
        <Link href={`/messages/chat?id=${convo.id}`} className="block hover:bg-muted/50">
            <div className="flex items-center gap-4 p-4">
                <div className="relative">
                    <Avatar className="h-14 w-14">
                        <AvatarImage src={otherUser.avatar} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isActive && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className={cn("font-semibold truncate", isActive && "text-primary")}>{otherUser.name}</p>
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

export function ConversationList() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchConversations() {
      if (!authUser) {
        if (!useAuth().isGuest) return; // Wait for auth state to resolve
      }
      try {
        setLoading(true);
        if (authUser) {
            const convos = await getConversations(authUser.uid);
            setConversations(convos);
            setFilteredConversations(convos);
        } else {
            // Handle guest state
            setConversations([]);
            setFilteredConversations([]);
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, [authUser, useAuth().isGuest]);

  useEffect(() => {
    const results = conversations.filter(convo => {
        const otherUser = convo.users.find(u => u.id !== authUser?.uid);
        return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) || otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredConversations(results);
  }, [searchQuery, conversations, authUser]);

  const handleNewMessageClick = () => {
      router.push('/search');
  }

  if (loading) {
    return <ConversationListSkeleton />;
  }
  
  if (useAuth().isGuest) {
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
      <header className="p-4 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <Button variant="ghost" size="icon" onClick={handleNewMessageClick}>
            <Icons.pencil className="h-5 w-5" />
            <span className="sr-only">New Message</span>
        </Button>
      </header>
      <div className="p-4">
        <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search" 
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
            <p className="mt-4 font-semibold">No Messages</p>
            <p className="text-sm">Start a conversation by messaging someone from their profile.</p>
          </div>
        )}
      </div>
      <div className="absolute bottom-6 right-6">
          <Button size="lg" className="rounded-full h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg" onClick={handleNewMessageClick}>
                <Icons.plus className="h-8 w-8" />
                <span className="sr-only">New Message</span>
          </Button>
      </div>
    </div>
  );
}
