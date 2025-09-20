
"use client";

import React from "react";
import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HelpCenterPage() {

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
                    <h1 className="text-xl font-semibold mx-auto">Help Center</h1>
                    <div className="w-9"></div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background p-8">
                    <div className="prose dark:prose-invert mx-auto">
                        <h2>Frequently Asked Questions</h2>
                        
                        <h4>How do I change my password?</h4>
                        <p>You can change your password from the main settings page. Click on the "Password" option in the "Account" section to receive a password reset email.</p>

                        <h4>How do I make my account private?</h4>
                        <p>Toggle the "Private Account" switch in the "Privacy" section of the settings page. When your account is private, only users you approve can see your posts.</p>

                        <h4>What is Data Saver mode?</h4>
                        <p>Data Saver mode helps reduce your data usage by loading lower-quality images and videos. You can enable it in the "Data & Performance" section.</p>

                        <h2>Contact Support</h2>
                        <p>If you can't find the answer you're looking for, you can contact our support team directly by navigating to the "Report a Problem" page from the settings menu.</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
