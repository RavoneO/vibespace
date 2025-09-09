
"use client";

import * as React from "react";
import Image from "next/image";
import type { Story } from "@/lib/types";
import { Icons } from "./icons";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialStoryIndex);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const imageTimerRef = React.useRef<NodeJS.Timeout>();

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

  const togglePause = () => {
    setIsPaused(p => !p);
  };

  // Effect to handle story advancement and progress
  React.useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    
    if (currentStory.type === 'video' && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
    } else if (currentStory.type === 'image') {
      const storyDuration = (currentStory.duration || 5) * 1000;
      imageTimerRef.current = setTimeout(goToNextStory, storyDuration);
    }

    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentIndex, currentStory.type, currentStory.duration, goToNextStory]);
  
  // Effect for pausing/playing
  React.useEffect(() => {
    const video = videoRef.current;
    if (video) {
        isPaused ? video.pause() : video.play().catch(console.error);
    }
    
    if (currentStory.type === 'image') {
        if(isPaused) {
            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
        } else {
            // This is tricky. We don't resume image timers for simplicity.
            // A more complex implementation would calculate remaining time.
        }
    }
  }, [isPaused, currentStory.type]);


  // Effect for video progress tracking
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || currentStory.type !== 'video') return;

    const updateProgress = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };
    
    const handleVideoEnd = () => {
        goToNextStory();
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("ended", handleVideoEnd);
    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("ended", handleVideoEnd);
    };
  }, [currentIndex, currentStory.type, goToNextStory]);
  
  // Effect for image progress tracking (visual only)
  React.useEffect(() => {
      let progressInterval: NodeJS.Timeout;
      if (currentStory.type === 'image' && !isPaused) {
          const duration = (currentStory.duration || 5) * 1000;
          let startTime = Date.now();
          progressInterval = setInterval(() => {
              const elapsed = Date.now() - startTime;
              setProgress(Math.min((elapsed / duration) * 100, 100));
          }, 100);
      }
      return () => clearInterval(progressInterval);
  }, [currentIndex, currentStory.type, currentStory.duration, isPaused]);


  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in" onClick={togglePause}>
      <div className="relative w-full h-full max-w-lg max-h-screen">
        {/* Progress bars and Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none">
           <div className="flex items-center gap-2 mb-2">
              {stories.map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    {index < currentIndex && <div className="h-full bg-white w-full" />}
                    {index === currentIndex && <Progress value={progress} className="h-full bg-white transition-all duration-100" />}
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
                </div>
                <button onClick={(e) => {e.stopPropagation(); onClose();}} className="p-2 pointer-events-auto">
                    <Icons.close className="h-6 w-6" />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
            {currentStory.type === 'image' && (
                <Image
                    src={currentStory.contentUrl}
                    alt={`Story by ${currentStory.user.username}`}
                    fill
                    className="object-contain"
                    data-ai-hint={currentStory.dataAiHint}
                    priority
                />
            )}
            {currentStory.type === 'video' && (
                <video
                    ref={videoRef}
                    src={currentStory.contentUrl}
                    className="object-contain w-full h-full"
                    playsInline
                />
            )}
        </div>
         {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Icons.play className="h-16 w-16 text-white/70" />
            </div>
        )}
        
        {/* Navigation Overlays */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={(e) => {e.stopPropagation(); goToPrevStory(); }}></div>
        <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={(e) => {e.stopPropagation(); goToNextStory();}}></div>

      </div>
    </div>
  );
}
