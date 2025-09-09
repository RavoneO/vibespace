
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

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome to Vibespace!" });
      router.push("/feed");
    } catch (error) {
      console.error("Google sign up error", error);
      toast({
        title: "Sign up failed",
        description: "Could not sign up with Google. Please try again.",
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
          <CardTitle className="text-2xl">Create your Vibespace Account</CardTitle>
          <CardDescription>Join the community and start sharing your vibes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button onClick={handleGoogleSignUp} disabled={isLoading} className="w-full">
            {isLoading && <Icons.spinner className="animate-spin mr-2" />}
            Sign Up with Google
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
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
