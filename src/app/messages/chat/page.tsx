
"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { useAuth } from '@/hooks/use-auth';
import { getMessagesQuery, markAsRead } from '@/services/messageService';
import { sendMessage, uploadMedia } from '@/services/messageService.server';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message, User, Conversation } from '@/lib/types';
import { getUserById } from '@/services/userService.server';

import AppLayout from '@/components/app-layout';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


function ChatPageSkeleton() {
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

function ChatBubble({ message, isOwnMessage, sender, isRead }: { message: Message; isOwnMessage: boolean, sender?: User | null, isRead: boolean }) {
    const renderMessageContent = () => {
        switch(message.type) {
            case 'image':
                return <img src={message.contentUrl} alt="Sent image" className="rounded-lg max-w-xs object-cover" />;
            case 'video':
                return <video src={message.contentUrl} controls className="rounded-lg max-w-xs" />;
            case 'file':
                return (
                    <a href={message.contentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-secondary p-3 rounded-lg hover:bg-muted">
                        <Icons.file className="h-8 w-8"/>
                        <div>
                            <p className="font-semibold">{message.fileName}</p>
                            <p className="text-sm text-muted-foreground">{message.fileSize ? `${(message.fileSize / 1024).toFixed(2)} KB` : ''}</p>
                        </div>
                    </a>
                )
            default: // text
                 return <p className="text-sm px-3 py-2">{message.text}</p>;
        }
    }
    
    return (
        <div className={cn("flex items-end gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
             {!isOwnMessage && sender && (
                <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src={sender.avatar} />
                    <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                 "max-w-xs md:max-w-md lg:max-w-lg",
                 !isOwnMessage && sender && "ml-3"
            )}>
                 {!isOwnMessage && sender && <p className="text-xs text-muted-foreground mb-1">{sender.name}</p>}
                 <div className={cn(
                    "rounded-2xl",
                    message.type === 'text' ? (isOwnMessage ? "bg-primary text-primary-foreground" : "bg-secondary") : "p-1 bg-transparent"
                 )}>
                    {renderMessageContent()}
                 </div>
                 {isOwnMessage && isRead && <p className='text-xs text-muted-foreground text-right mt-1'>Seen</p>}
                 {message.text && message.type !== 'text' && (
                    <p className="text-xs text-muted-foreground mt-1 px-2">{message.text}</p>
                 )}
            </div>
        </div>
    );
}

function ChatPageContent() {
    const searchParams = useSearchParams();
    const conversationId = searchParams.get('id');
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const [participants, setParticipants] = useState<Record<string, User>>({});
    const [newMessage, setNewMessage] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [conversationDoc, conversationLoading] = useDocumentData(
        conversationId ? doc(db, 'conversations', conversationId) : null
    );
    const conversation = conversationDoc as Conversation | undefined;

    const [messagesSnapshot, messagesLoading] = useCollection(
        conversationId ? getMessagesQuery(conversationId) : null
    );

    const messages = messagesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)) || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        async function fetchParticipants() {
            if (conversation) {
                const userPromises = conversation.userIds.map(id => getUserById(id));
                const users = await Promise.all(userPromises);
                const userMap = users.reduce((acc, user) => {
                    if(user) acc[user.id] = user;
                    return acc;
                }, {} as Record<string, User>)
                setParticipants(userMap);
            }
        }
        fetchParticipants();
    }, [conversation]);
    
    useEffect(() => {
        if (messages.length > 0 && authUser && conversationId) {
            messages.forEach(message => {
                if (message.senderId !== authUser.uid && (!message.readBy || !message.readBy[authUser.uid])) {
                    markAsRead(conversationId, message.id, authUser.uid);
                }
            });
        }
    }, [messages, authUser, conversationId]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setMediaFile(file);
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                setMediaPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !mediaFile) || !authUser || !conversationId) return;

        setIsSending(true);
        
        try {
            let mediaInfo: { url: string; type: 'image' | 'video' | 'file'; name: string, size: number } | undefined = undefined;

            if (mediaFile) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('media', mediaFile);
                try {
                    mediaInfo = await uploadMedia(formData);
                    toast({ title: "Upload Complete" });
                } catch (error) {
                    toast({ title: "Upload Failed", description: "Could not upload your file.", variant: "destructive" });
                    return;
                } finally {
                    setIsUploading(false);
                }
            }

            await sendMessage(conversationId, authUser.uid, newMessage || undefined, mediaInfo);

            setNewMessage("");
            setMediaFile(null);
            setMediaPreview(null);
            if(fileInputRef.current) fileInputRef.current.value = "";

        } catch (error) {
            console.error("Failed to send message", error);
            toast({ title: "Send Failed", description: "Could not send your message.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };
    
    const otherUser = conversation && !conversation.isGroup ? Object.values(participants).find(p => p.id !== authUser?.uid) : null;
    
    if (conversationLoading || (messagesLoading && !messages.length) || (Object.keys(participants).length === 0 && !conversationLoading)) {
        return <ChatPageSkeleton />;
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
                    <Avatar>
                        {conversation?.isGroup ? 
                          <AvatarFallback><Icons.users className="h-5 w-5"/></AvatarFallback> : 
                          <>
                            <AvatarImage src={otherUser?.avatar} />
                            <AvatarFallback>{otherUser?.name.charAt(0)}</AvatarFallback>
                          </>}
                    </Avatar>
                    <h2 className="font-semibold flex-1">{conversation?.isGroup ? conversation.groupName : otherUser?.name}</h2>
                    {!conversation?.isGroup && (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon"><Icons.phone className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon"><Icons.reels className="h-5 w-5" /></Button>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((message) => {
                        const otherUserIds = conversation?.userIds.filter(id => id !== message.senderId) || [];
                        const isReadByAll = otherUserIds.length > 0 && otherUserIds.every(id => message.readBy && message.readBy[id]);

                        return (
                            <ChatBubble 
                                key={message.id} 
                                message={message} 
                                isOwnMessage={message.senderId === authUser?.uid}
                                sender={conversation?.isGroup ? participants[message.senderId] : null}
                                isRead={isReadByAll}
                            />
                        )
                    })}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t sticky bottom-0 bg-background z-10 space-y-2">
                    {mediaPreview && (
                        <div className="relative w-32 h-32 rounded-md overflow-hidden">
                            <img src={mediaPreview} alt="Preview" className="object-cover w-full h-full" />
                            <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => { setMediaFile(null); setMediaPreview(null); }}>
                                <Icons.close className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {mediaFile && !mediaPreview && (
                         <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                            <Icons.file className="h-8 w-8"/>
                            <div>
                                <p className="font-semibold text-sm">{mediaFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(mediaFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                             <Button size="icon" variant="ghost" className="ml-auto" onClick={() => setMediaFile(null)}>
                                <Icons.close className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isSending}>
                                    <Icons.plus className="h-5 w-5" />
                                    <span className="sr-only">Add Media</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                                    <Icons.image className="mr-2 h-4 w-4" />
                                    Photo or Video
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                                    <Icons.file className="mr-2 h-4 w-4" />
                                    Document
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={mediaFile ? "Add a caption..." : "Type a message..."}
                            disabled={isSending || isUploading}
                            autoComplete="off"
                            className="bg-muted border-none focus-visible:ring-primary"
                        />
                        <Button type="submit" size="icon" disabled={isSending || isUploading || (!newMessage.trim() && !mediaFile)}>
                            {isSending || isUploading ? <Icons.spinner className="animate-spin" /> : <Icons.send />}
                            <span className="sr-only">Send</span>
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
                    </form>
                </footer>
            </div>
        </AppLayout>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<ChatPageSkeleton />}>
            <ChatPageContent />
        </Suspense>
    )
}
