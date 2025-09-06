
"use client"

import * as React from "react";
import type { Story } from "@/lib/types";
import { currentUser } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "./icons";
import { StoryViewer } from "./story-viewer";
import { Skeleton } from "./ui/skeleton";

interface StoriesProps {
    stories: Story[];
}

export function Stories({ stories }: StoriesProps) {
    const [viewerOpen, setViewerOpen] = React.useState(false);
    const [selectedStoryIndex, setSelectedStoryIndex] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (stories.length > 0) {
            setLoading(false);
        }
    }, [stories]);

    const openStory = (index: number) => {
        setSelectedStoryIndex(index);
        setViewerOpen(true);
    }
    
    const currentUserStory = stories.find(s => s.user.id === currentUser.id);
    const otherUserStories = stories.filter(s => s.user.id !== currentUser.id);

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
            <div className="relative p-4">
                <div className="flex space-x-4 overflow-x-auto pb-2 -mb-2">
                    {currentUserStory && (
                         <div className="flex-shrink-0 w-20 text-center">
                            <div className="relative">
                                <Avatar className="w-16 h-16 mx-auto border-2 border-dashed border-muted-foreground">
                                    <AvatarImage src={currentUserStory.user.avatar} />
                                    <AvatarFallback>{currentUserStory.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-2 border-background">
                                    <Icons.plus className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs mt-1.5 truncate text-muted-foreground">Your Story</p>
                        </div>
                    )}
                    {otherUserStories.map((story, index) => (
                        <button key={story.id} onClick={() => openStory(index + (currentUserStory ? 1 : 0))} className="flex-shrink-0 w-20 text-center focus:outline-none">
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
