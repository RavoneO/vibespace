
"use client";

import React from "react";
import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TermsOfServicePage() {

    return (
        <AppLayout>
            <div className="flex flex-col h-full">
                <header className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/settings">
                            <Icons.back />
                            <span className="sr-only">Back to Settings</span>
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold mx-auto">Terms of Service</h1>
                    <div className="w-9"></div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background p-8">
                    <div className="prose dark:prose-invert mx-auto">
                        <h2>1. Introduction</h2>
                        <p>Welcome to our application. By accessing or using our service, you agree to be bound by these Terms of Service. Please read them carefully.</p>

                        <h2>2. User Accounts</h2>
                        <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.</p>

                        <h2>3. Content</h2>
                        <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.</p>

                        <h2>4. Prohibited Uses</h2>
                        <p>You may use the Service only for lawful purposes and in accordance with the Terms. You agree not to use the Service in any way that violates any applicable national or international law or regulation.</p>

                        <h2>5. Termination</h2>
                        <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

                        <h2>6. Governing Law</h2>
                        <p>These Terms shall be governed and construed in accordance with the laws of the land, without regard to its conflict of law provisions.</p>

                        <h2>7. Changes to Terms</h2>
                        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect.</p>

                        <p className="text-sm text-muted-foreground">Last updated: October 26, 2023</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
