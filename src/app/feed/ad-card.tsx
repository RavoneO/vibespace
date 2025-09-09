

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import type { Ad } from "@/services/adService";

export function AdCard({ ad }: { ad: Ad | null }) {

    if (!ad) {
        // Don't render anything if no ad could be selected
        return null;
    }

    return (
        <Card className="m-4 border-2 border-dashed border-accent">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                            src={ad.imageUrl}
                            alt={ad.headline}
                            width={96}
                            height={96}
                            className="rounded-md object-cover"
                            data-ai-hint="product photo"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-accent">Sponsored</p>
                                <h3 className="font-bold">{ad.headline}</h3>
                            </div>
                            <Icons.more className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {ad.description}
                        </p>
                        <Button asChild size="sm" variant="outline" className="w-full">
                            <Link href="#">
                                Learn More
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
