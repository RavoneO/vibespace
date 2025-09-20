
"use client";

import React, { useState } from "react";
import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ReportProblemPage() {
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const [report, setReport] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!report.trim()) {
            toast({ title: "Error", description: "Please describe the problem before submitting.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Problem reported by", authUser?.email, ":", report);
        setIsSubmitting(false);
        setReport("");
        toast({ title: "Report Submitted", description: "Thank you for your feedback. Our team will look into it shortly." });
    };

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
                    <h1 className="text-xl font-semibold mx-auto">Report a Problem</h1>
                    <div className="w-9"></div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background p-6">
                    <div className="max-w-xl mx-auto space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold">Describe the Issue</h2>
                            <p className="text-sm text-muted-foreground">Please provide as much detail as possible so we can resolve the issue quickly.</p>
                        </div>
                        
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="problem-description">Problem Description</Label>
                            <Textarea 
                                id="problem-description"
                                placeholder="Tell us what went wrong..."
                                rows={8}
                                value={report}
                                onChange={(e) => setReport(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                            {isSubmitting ? <Icons.spinner className="h-5 w-5 animate-spin" /> : "Submit Report"}
                        </Button>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
