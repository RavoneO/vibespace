
"use client"

import * as React from "react";
import type { Story } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "./icons";
import { StoryViewer } from "./story-viewer";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createStory } from "@/services/storyService";
import { uploadFile } from "@/services/storageService";

interface StoriesProps {
    stories: Story[];
}

export function Stories({ stories }: StoriesProps) {
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [viewerOpen, setViewerOpen] = React.useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [isUploading, setIsUploading] = React.useState(false);

    React.useEffect(() => {
        if (stories) {
            setLoading(false);
        }
    }, [stories]);

    const openStory = (index: number) => {
        setSelectedStoryIndex(index);
        setViewerOpen(true);
    }
    
    const handleAddStoryClick = () => {
        if (!authUser) {
            toast({ title: "Please log in to add a story.", variant: "destructive" });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !authUser) return;

        setIsUploading(true);
        toast({ title: "Uploading your story..." });

        try {
            const fileType = file.type.startsWith('image') ? 'image' : 'video';
            const contentUrl = await uploadFile(file, `stories/${authUser.uid}/${Date.now()}_${file.name}`);

            await createStory({
                userId: authUser.uid,
                type: fileType,
                contentUrl,
                duration: 5, // default duration
            });
            
            toast({ title: "Story posted successfully!" });
            // Ideally, we'd have a real-time subscription to update stories.
            // For now, a page refresh would show the new story.
        } catch (error) {
            console.error("Error creating story:", error);
            toast({
                title: "Failed to post story",
                description: "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
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
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
            />
            <div className="relative p-4">
                <div className="flex space-x-4 overflow-x-auto pb-2 -mb-2">
                     <div className="flex-shrink-0 w-20 text-center">
                        <div className="relative">
                            <Avatar className="w-16 h-16 mx-auto border-2 border-dashed border-muted-foreground">
                                {currentUserStory ? (
                                     <AvatarImage src={currentUserStory.user.avatar} />
                                ) : authUser ? (
                                    <AvatarImage src={authUser.photoURL || ''} />
                                ) : null}
                                <AvatarFallback>{authUser?.displayName?.charAt(0) || 'G'}</AvatarFallback>
                            </Avatar>
                            <button 
                                onClick={handleAddStoryClick} 
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-2 border-background disabled:bg-muted"
                            >
                                {isUploading ? <Icons.spinner className="w-4 h-4 animate-spin" /> : <Icons.plus className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs mt-1.5 truncate text-muted-foreground">Your Story</p>
                    </div>
                    {otherUserStories.map((story, index) => (
                        <button key={story.id} onClick={() => openStory(index + 1)} className="flex-shrink-0 w-20 text-center focus:outline-none">
                             <div className="w-18 h-18 p-1 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500">
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
