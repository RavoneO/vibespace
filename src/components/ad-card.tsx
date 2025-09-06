
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export function AdCard() {
  return (
    <Card className="overflow-hidden animate-fade-in border-2 border-accent/50">
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <div className="grid gap-0.5 text-sm">
          <div className="font-semibold">Sponsored Content</div>
          <div className="text-xs text-muted-foreground flex items-center">
            <Icons.ad className="w-3 h-3 mr-1" />
            <span>Promoted</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto">
          <Icons.more />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src="https://picsum.photos/800/450"
            alt="Advertisement"
            fill
            className="object-cover"
            data-ai-hint="advertisement product"
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start gap-3">
        <h3 className="font-bold text-lg">The Future of Tech is Here</h3>
        <p className="text-sm text-foreground/90">
            Discover our new gadget that will revolutionize your daily life. High performance, sleek design.
        </p>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 mt-2">
            <Link href="#">
                Learn More
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
