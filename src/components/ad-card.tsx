"use client";

import type { Ad } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export function AdCard({ ad }: { ad: Ad }) {
  return (
    <div className="p-4">
        <Card className="overflow-hidden border-2 border-dashed border-accent">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>{ad.headline}</CardTitle>
                    <CardDescription>{ad.description}</CardDescription>
                </div>
                <Badge variant="outline">Ad</Badge>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="relative w-full aspect-video">
                 <Image
                    src={ad.imageUrl}
                    alt={ad.headline}
                    fill
                    className="object-cover"
                    data-ai-hint="advertisement background"
                />
            </div>
        </CardContent>
        <CardFooter className="p-4 bg-secondary/50">
            <Button asChild className="w-full">
                <Link href="#">Learn More</Link>
            </Button>
        </CardFooter>
        </Card>
    </div>
  );
}
