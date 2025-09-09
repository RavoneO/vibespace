
"use client";

import * as React from "react";
import { Post as PostType } from "@/lib/types";
import { Icons } from "./icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface ReelViewerProps {
  reels: PostType[];
  initialReelIndex: number;
  onClose: () => void;
}

export function ReelViewer({
  reels,
  initialReelIndex,
  onClose,
}: ReelViewerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialReelIndex);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  const currentReel = reels[currentIndex];

  const goToNextReel = React.useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reels.length);
  }, [reels.length]);

  const goToPrevReel = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reels.length) % reels.length);
  };
  
  const togglePlayPause = () => {
      const video = videoRef.current;
      if (video) {
          if(video.paused) {
              video.play();
              setIsPaused(false);
          } else {
              video.pause();
              setIsPaused(true);
          }
      }
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goToNextReel();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goToPrevReel();
      if (e.key === "Escape") onClose();
      if (e.key === " ") togglePlayPause();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextReel, goToPrevReel, onClose]);
  
  React.useEffect(() => {
      setIsPaused(false);
      videoRef.current?.play().catch(e => console.error("Autoplay was prevented.", e));
  }, [currentIndex]);


  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in">
      <div className="relative w-full h-full max-w-md mx-auto aspect-[9/16] overflow-hidden bg-black rounded-lg">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-30 text-white bg-black/30 rounded-full p-2"
          aria-label="Close viewer"
        >
          <Icons.back className="h-6 w-6" />
        </button>

        {/* Main Content */}
        <AnimatePresence initial={false}>
            <motion.div
                key={currentIndex}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
            >
                <video
                    ref={videoRef}
                    src={currentReel.contentUrl}
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    playsInline
                    onClick={togglePlayPause}
                />
                 {isPaused && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 1.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <Icons.play className="w-16 h-16 text-white/50" />
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>

        {/* Overlay UI */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-10 h-10 border-2">
                    <AvatarImage src={currentReel.user.avatar} />
                    <AvatarFallback>{currentReel.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-white">@{currentReel.user.username}</p>
            </div>
            <p className="text-white text-sm line-clamp-2">{currentReel.caption}</p>
        </div>

        {/* Side Actions */}
        <div className="absolute bottom-20 right-2 flex flex-col gap-4 z-20">
            <Button variant="ghost" size="icon" className="text-white flex-col h-auto">
                <Icons.like className="h-8 w-8" />
                <span className="text-xs">{currentReel.likes}</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-white flex-col h-auto">
                <Icons.comment className="h-8 w-8" />
                <span className="text-xs">{currentReel.comments.length}</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
                <Icons.send className="h-8 w-8" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
                <Icons.more className="h-8 w-8" />
            </Button>
        </div>
        
        {/* Navigation */}
        <button onClick={goToPrevReel} className="absolute top-1/2 -translate-y-1/2 left-2 z-30 p-2 bg-black/20 rounded-full text-white md:hidden">
            <Icons.chevronRight className="-rotate-90"/>
        </button>
         <button onClick={goToNextReel} className="absolute top-1/2 -translate-y-1/2 right-2 z-30 p-2 bg-black/20 rounded-full text-white md:hidden">
            <Icons.chevronRight className="rotate-90"/>
        </button>

      </div>
    </div>
  );
}
