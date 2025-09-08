
"use client"

import * as React from "react";
import type { Story, User as UserType } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "./icons";
import { StoryViewer } from "./story-viewer";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createStory, getStories, updateStory } from "@/services/storyService";
import { uploadFile } from "@/services/storageService";
import Link from "next/link";
import { Button } from "./ui/button";
import { getUserById } from "@/services/userService";
import { cn } from "@/lib/utils";

interface StoriesProps {
    stories: Story[];
}

export function Stories({ stories: initialStories }: StoriesProps) {
    const { user: authUser, isGuest } = useAuth();
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [viewerOpen, setViewerOpen] = React.useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);
    const [stories, setStories] = React.useState(initialStories);
    const [currentUserProfile, setCurrentUserProfile] = React.useState<UserType | null>(null);

    React.useEffect(() => {
        setStories(initialStories);
        setLoading(false);
    }, [initialStories]);

    React.useEffect(() => {
        const fetchUserProfile = async () => {
            if (authUser && !isGuest) {
                const profile = await getUserById(authUser.uid);
                setCurrentUserProfile(profile);
            }
        };
        fetchUserProfile();
    }, [authUser, isGuest]);

    const openStory = (index: number) => {
        setSelectedStoryIndex(index);
        setViewerOpen(true);
    }
    
    const handleAddStoryClick = () => {
        if (!authUser || isGuest) {
            toast({ 
                title: "Log in or sign up to add a story.", 
                variant: "destructive",
                action: <Link href="/signup"><Button>Sign Up</Button></Link> 
            });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !authUser) return;
    
        setIsUploading(true);
        toast({ title: "Uploading your story..." });
    
        const backgroundUpload = async () => {
          let storyId = '';
          try {
            const fileType = file.type.startsWith('image') ? 'image' : 'video';
            
            storyId = await createStory({
              userId: authUser.uid,
              type: fileType,
              duration: fileType === 'video' ? 15 : 5, // Example duration
            });

            const contentUrl = await uploadFile(file, `stories/${authUser.uid}/${storyId}_${file.name}`);
    
            await updateStory(storyId, {
              contentUrl,
              status: 'published'
            });
    
            toast({ title: "Story posted successfully!" });
            const updatedStories = await getStories();
            setStories(updatedStories);
          } catch (error) {
            console.error("Error creating story:", error);
            if (storyId) {
                await updateStory(storyId, { status: 'failed' });
            }
            toast({
              title: "Failed to post story",
              description: "Please try again later.",
              variant: "destructive",
            });
          } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
             setIsUploading(false);
          }
        };
    
        backgroundUpload();
    };
    
    const currentUserStory = stories.find(s => s.user.id === authUser?.uid);
    const otherUserStories = stories.filter(s => s.user.id !== authUser?.uid);

    if (loading) {
        return (
            <div className="relative p-4">
                <div className="flex space-x-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-20 text-center space-y-1.5">
                            <Skeleton className="w-16 h-16 mx-auto rounded-full" />
                            <Skeleton className="h-3 w-16 mx-auto" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
                disabled={isUploading}
            />
            <div className="relative p-4 border-b">
                <div className="flex space-x-4 overflow-x-auto pb-2 -mb-2">
                     <button onClick={handleAddStoryClick} disabled={isUploading} className="flex-shrink-0 w-20 text-center group">
                        <div className="relative">
                            <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center group-hover:border-primary transition-colors">
                                {isUploading ? <Icons.spinner className="w-6 h-6 animate-spin" /> : <Icons.plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />}
                            </div>
                        </div>
                        <p className="text-xs mt-1.5 truncate text-muted-foreground">Your Story</p>
                    </button>
                    
                    {stories.map((story, index) => (
                        <button key={story.id} onClick={() => openStory(index)} className="flex-shrink-0 w-20 text-center focus:outline-none">
                             <div className={cn(
                                "w-18 h-18 p-0.5 rounded-full",
                                story.viewed ? "bg-muted-foreground" : "bg-gradient-to-r from-green-400 to-emerald-600"
                             )}>
                                <Avatar className="w-16 h-16 mx-auto border-2 border-background">
                                    <AvatarImage src={story.user.avatar} />
                                    <AvatarFallback>{story.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <p className="text-xs mt-1.5 truncate">{story.user.username}</p>
                        </button>
                    ))}
                </div>
            </div>
            {viewerOpen && (
                <StoryViewer
                    stories={stories}
                    initialStoryIndex={selectedStoryIndex}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </>
    );
}
