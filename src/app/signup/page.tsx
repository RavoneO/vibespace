
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();

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
           <Button onClick={() => signIn("google")} className="w-full">
            Sign Up with Google
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
             <p>
              Or back to{" "}
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
