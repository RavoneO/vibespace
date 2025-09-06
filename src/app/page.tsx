
"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/feed");
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center space-y-6">
                <div className="p-4 rounded-full bg-primary/10">
                   <Icons.sparkles className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
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
                <Button asChild size="lg" className="w-full">
                    <Link href="/signup">Create Account</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="w-full">
                    <Link href="/login">Log In</Link>
                </Button>
            </div>
        </div>
    </div>
  );
}
