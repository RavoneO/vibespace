
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getConversations } from "@/services/messageService";
import type { Conversation } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Icons } from "@/components/icons";

export function ConversationList() {
  const { user: authUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
      if (!authUser) return;
      try {
        setLoading(true);
        const convos = await getConversations(authUser.uid);
        setConversations(convos);
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, [authUser]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90 mb-4">Messages</h1>
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Messages</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map((convo) => {
            const otherUser = convo.users.find((u) => u.id !== authUser?.uid);
            if (!otherUser) return null;

            return (
              <Link href={`/messages/${convo.id}`} key={convo.id} className="block hover:bg-muted/50">
                <div className="flex items-center gap-4 p-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={otherUser.avatar} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold truncate">{otherUser.name}</p>
                        {convo.lastMessage?.timestamp && (
                             <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date((convo.lastMessage.timestamp as any).seconds * 1000), { addSuffix: true })}
                            </p>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                        {convo.lastMessage?.text || "No messages yet."}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground py-24 px-4">
            <Icons.messages className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">No Messages</p>
            <p className="text-sm">Start a conversation by messaging someone from their profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
