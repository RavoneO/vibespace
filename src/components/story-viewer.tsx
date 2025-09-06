
"use client";

import * as React from "react";
import Image from "next/image";
import type { Story } from "@/lib/types";
import { Icons } from "./icons";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialStoryIndex);
  const [progress, setProgress] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout>();
  const progressTimerRef = React.useRef<NodeJS.Timeout>();

  const currentStory = stories[currentIndex];

  const goToNextStory = React.useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  React.useEffect(() => {
    setProgress(0);

    const storyDuration = (currentStory.duration || 5) * 1000;

    const startTimers = () => {
        timerRef.current = setTimeout(goToNextStory, storyDuration);

        const progressInterval = 100; // Update progress every 100ms
        let currentProgress = 0;

        progressTimerRef.current = setInterval(() => {
            currentProgress += (progressInterval / storyDuration) * 100;
            setProgress(Math.min(currentProgress, 100));
        }, progressInterval);
    }
    
    startTimers();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, currentStory.duration, goToNextStory]);


  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in">
      <div className="relative w-full h-full max-w-lg max-h-screen">
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
           <div className="flex items-center gap-2 mb-2">
              {stories.map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    {index < currentIndex && <div className="h-full bg-white w-full" />}
                    {index === currentIndex && <Progress value={progress} className="h-full bg-white" />}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={currentStory.user.avatar} />
                        <AvatarFallback>{currentStory.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{currentStory.user.username}</span>
                    <span className="text-xs text-white/70">{currentStory.timestamp}</span>
                </div>
                <button onClick={onClose} className="p-2">
                    <Icons.close className="h-6 w-6" />
                </button>
            </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
            <Image
                src={currentStory.contentUrl}
                alt={`Story by ${currentStory.user.username}`}
                fill
                className="object-contain"
                data-ai-hint={currentStory.dataAiHint}
            />
        </div>
        
        <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={goToPrevStory}></div>
        <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={goToNextStory}></div>

      </div>
    </div>
  );
}
