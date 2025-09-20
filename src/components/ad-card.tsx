
"use client";

import type { Ad } from "@/lib/types";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

interface AdCardProps {
  ad: Ad;
}

export function AdCard({ ad }: AdCardProps) {
  return (
    <Card className="overflow-hidden animate-fade-in bg-transparent border-0 border-b rounded-none shadow-none">
        <CardHeader className="flex flex-row items-center gap-3 p-4">
            <div className="grid gap-0.5 text-sm">
                <span className="font-semibold text-primary">Sponsored</span>
            </div>
        </CardHeader>
        <CardContent className="px-4 py-0">
            <div className="relative w-full overflow-hidden rounded-lg">
                <Image
                    src={ad.imageUrl}
                    alt={ad.headline}
                    width={400}
                    height={400}
                    className="object-cover w-full"
                />
            </div>
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-start gap-2">
            <h3 className="font-semibold">{ad.headline}</h3>
            <p className="text-sm text-muted-foreground">{ad.description}</p>
            <Button size="sm" className="mt-2">Learn More</Button>
        </CardFooter>
    </Card>
  );
}
