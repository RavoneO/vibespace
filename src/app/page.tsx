
"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center space-y-6">
                <div className="p-4 rounded-full bg-primary/10">
                   <Icons.sparkles className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold">Vibespace</h1>
                <p className="text-muted-foreground">Loading your experience...</p>
                <Icons.spinner className="h-6 w-6 animate-spin text-primary" />
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <div className="flex flex-col items-center space-y-6 max-w-sm">
            <div className="p-4 rounded-full bg-primary/10">
                <Icons.sparkles className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Welcome to Vibespace
            </h1>
            <p className="text-muted-foreground">
              Join the community to share your vibes, connect with friends, and discover new content.
            </p>
            <div className="w-full space-y-4 pt-4">
                <Button size="lg" className="w-full" onClick={() => signIn("google")}>
                    Sign in with Google
                </Button>
                 <Button asChild size="lg" variant="secondary" className="w-full">
                    <Link href="/feed">Continue as Guest</Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
