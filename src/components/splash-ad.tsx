"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Ad } from "@/services/adService";

interface SplashAdProps {
  ad: Ad;
  isOpen: boolean;
  onClose: () => void;
}

export function SplashAd({ ad, isOpen, onClose }: SplashAdProps) {
  if (!isOpen || !ad) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="p-0 border-0 max-w-lg">
        <div className="relative w-full aspect-square">
            <Image
                src={ad.imageUrl}
                alt={ad.headline}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint="advertisement background"
            />
        </div>
        <AlertDialogHeader className="p-6">
          <AlertDialogTitle className="text-2xl">{ad.headline}</AlertDialogTitle>
          <AlertDialogDescription>
            {ad.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="p-6 pt-0">
            <AlertDialogCancel asChild>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </AlertDialogCancel>
            <Button asChild>
                <Link href="#">Learn More</Link>
            </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
