
"use client";

import { useEffect, useState, useRef } from 'react';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { useAuth } from '@/hooks/use-auth';
import { getMessagesQuery, sendMessage } from '@/services/messageService';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message, User, Conversation } from '@/lib/types';
import { getUserById } from '@/services/userService';

import AppLayout from '@/components/app-layout';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

function ChatBubble({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) {
    return (
        <div className={cn("flex items-end gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3",
                isOwnMessage ? "bg-primary text-primary-foreground" : "bg-secondary"
            )}>
                <p className="text-sm">{message.text}</p>
            </div>
        </div>
    );
}

export default function ChatPage({ params }: { params: { conversationId: string } }) {
    const { user: authUser } = useAuth();
    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const [conversationDoc, conversationLoading] = useDocumentData(
        params.conversationId ? doc(db, 'conversations', params.conversationId) : null
    );
    const conversation = conversationDoc as Conversation | undefined;

    const [messagesSnapshot, messagesLoading, error] = useCollection(
        params.conversationId ? getMessagesQuery(params.conversationId) : null
    );

    const messages = messagesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)) || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        async function fetchOtherUser() {
            if (conversation && authUser) {
                const otherUserId = conversation.userIds.find(id => id !== authUser.uid);
                if (otherUserId) {
                    const user = await getUserById(otherUserId);
                    setOtherUser(user);
                }
            }
        }
        fetchOtherUser();
    }, [conversation, authUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !authUser) return;

        setIsSending(true);
        try {
            await sendMessage(params.conversationId, authUser.uid, newMessage);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsSending(false);
        }
    };
    
    if (conversationLoading || (messagesLoading && !messages.length) || (!otherUser && !conversationLoading)) {
        return (
             <AppLayout>
                <div className="flex flex-col h-full">
                    <header className="flex items-center p-2.5 border-b gap-4 sticky top-0 bg-background z-10">
                         <Link href="/messages">
                            <Icons.back />
                        </Link>
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                    </header>
                    <main className="flex-1 p-4 space-y-4">
                        <Skeleton className="h-12 w-48 rounded-lg" />
                        <Skeleton className="h-12 w-64 rounded-lg ml-auto" />
                        <Skeleton className="h-12 w-32 rounded-lg" />
                    </main>
                    <footer className="p-4 border-t sticky bottom-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-10 w-10 rounded-md" />
                        </div>
                    </footer>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="flex flex-col h-screen bg-card text-card-foreground">
                <header className="flex items-center p-2.5 border-b gap-4 sticky top-0 bg-background z-10">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/messages">
                            <Icons.back />
                        </Link>
                    </Button>
                    {otherUser ? (
                        <>
                        <Avatar>
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="font-semibold">{otherUser.name}</h2>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((message) => (
                        <ChatBubble key={message.id} message={message} isOwnMessage={message.senderId === authUser?.uid} />
                    ))}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t sticky bottom-0 bg-background z-10">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isSending || !authUser}
                            autoComplete="off"
                            className="bg-muted border-none focus-visible:ring-primary"
                        />
                        <Button type="submit" size="icon" disabled={isSending || !newMessage.trim() || !authUser}>
                            {isSending ? <Icons.spinner className="animate-spin" /> : <Icons.send />}
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </footer>
            </div>
        </AppLayout>
    );
}
