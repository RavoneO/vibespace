
"use client";

import React, { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { getBlockedUsers, unblockUser } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

function BlockedUserSkeleton() {
    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
            <Skeleton className="h-10 w-24" />
        </div>
    );
}

export default function BlockedUsersPage() {
    const { user: authUser, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBlockedUsers() {
            if (!authUser) return;
            try {
                const users = await getBlockedUsers(authUser.uid);
                setBlockedUsers(users);
            } catch (error) {
                console.error("Failed to fetch blocked users:", error);
                toast({ title: "Error", description: "Could not load blocked users.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            fetchBlockedUsers();
        }
    }, [authUser, authLoading, toast]);

    const handleUnblock = async (userId: string) => {
        if (!authUser) return;
        try {
            await unblockUser(authUser.uid, userId);
            setBlockedUsers(prev => prev.filter(user => user.id !== userId));
            toast({ title: "User unblocked" });
        } catch (error) {
            console.error("Failed to unblock user:", error);
            toast({ title: "Error", description: "Could not unblock user.", variant: "destructive" });
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col h-full">
                <header className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/settings">
                            <Icons.back />
                            <span className="sr-only">Back to Settings</span>
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold mx-auto">Blocked Accounts</h1>
                    <div className="w-9"></div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[...Array(3)].map((_, i) => <BlockedUserSkeleton key={i} />)}
                        </div>
                    ) : blockedUsers.length > 0 ? (
                        <div className="divide-y divide-border">
                            {blockedUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => handleUnblock(user.id)}>
                                        Unblock
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <p className="text-muted-foreground">You haven't blocked any accounts.</p>
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
