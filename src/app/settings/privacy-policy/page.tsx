
"use client";

import React from "react";
import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PrivacyPolicyPage() {

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
                    <h1 className="text-xl font-semibold mx-auto">Privacy Policy</h1>
                    <div className="w-9"></div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background p-8">
                    <div className="prose dark:prose-invert mx-auto">
                        <h2>1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>

                        <h2>2. How We Use Your Information</h2>
                        <p>We use the information we collect to provide, maintain, and improve our services, including to process transactions, develop new products, and provide customer support. We may also use the information to communicate with you about products, services, offers, and events offered by our company.</p>

                        <h2>3. Information Sharing</h2>
                        <p>We do not share your personal information with third parties except as described in this Privacy Policy. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>

                        <h2>4. Data Security</h2>
                        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction.</p>

                        <h2>5. Your Choices</h2>
                        <p>You may update, correct or delete information about you at any time by logging into your online account. If you wish to delete or deactivate your account, please email us, but note that we may retain certain information as required by law or for legitimate business purposes.</p>

                        <h2>6. Children's Privacy</h2>
                        <p>Our service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.</p>

                        <p className="text-sm text-muted-foreground">Last updated: October 26, 2023</p>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
