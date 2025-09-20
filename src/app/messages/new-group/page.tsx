
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { createGroupConversation, getAllUsers } from '@/services/messageService.server';
import type { User } from '@/lib/types';

import AppLayout from '@/components/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

export default function NewGroupPage() {
    const { user: authUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        async function fetchUsers() {
            setIsLoading(true);
            try {
                const allUsers = await getAllUsers();
                // Exclude the current user from the list
                if(authUser) {
                    setUsers(allUsers.filter(u => u.id !== authUser.uid));
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
            }
            setIsLoading(false);
        }
        fetchUsers();
    }, [authUser, toast]);

    const handleUserToggle = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0 || !authUser) {
            toast({ title: "Invalid Group", description: "Please enter a group name and select at least one member.", variant: "destructive" });
            return;
        }

        setIsCreating(true);
        try {
            const participantIds = [...selectedUsers, authUser.uid];
            const conversationId = await createGroupConversation(participantIds, groupName);
            toast({ title: "Group Created!", description: `The group "${groupName}" has been created.` });
            router.push(`/messages/chat?id=${conversationId}`);
        } catch (error) {
            console.error("Failed to create group", error);
            toast({ title: "Error", description: "Failed to create the group.", variant: "destructive" });
        }
        setIsCreating(false);
    };

    return (
        <AppLayout>
            <div className="flex flex-col h-full">
                <header className="p-4 border-b">
                    <h1 className="text-2xl font-bold">Create New Group</h1>
                </header>

                <main className="flex-1 p-4 space-y-4">
                    <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input 
                            id="group-name"
                            placeholder="Enter a name for your group"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-2">Select Members</h2>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <Icons.spinner className="animate-spin h-8 w-8" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                                        <Checkbox 
                                            id={`user-${user.id}`}
                                            onCheckedChange={() => handleUserToggle(user.id)}
                                            checked={selectedUsers.includes(user.id)}
                                        />
                                        <Label htmlFor={`user-${user.id}`} className="flex items-center gap-3 cursor-pointer flex-1">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <footer className="p-4 border-t">
                    <Button 
                        onClick={handleCreateGroup} 
                        disabled={isCreating || isLoading || !groupName.trim() || selectedUsers.length === 0}
                        className="w-full"
                        size="lg"
                    >
                        {isCreating ? <Icons.spinner className="animate-spin mr-2" /> : null}
                        Create Group ({selectedUsers.length} members)
                    </Button>
                </footer>
            </div>
        </AppLayout>
    );
}
