
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Successfully signed in!" });
      router.push("/feed");
    } catch (error) {
      console.error("Google sign in error", error);
      toast({
        title: "Sign in failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Icons.sparkles className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl">Welcome back to Vibespace</CardTitle>
          <CardDescription>Log in to continue sharing your vibes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
            {isLoading && <Icons.spinner className="animate-spin mr-2" />}
            Sign In with Google
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              No account?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
             <p className="mt-2">
              Back to{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                welcome page
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
