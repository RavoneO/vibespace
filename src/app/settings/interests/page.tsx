
"use client";

import React, { useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { updateUserSettings, getUserInterests } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ALL_INTERESTS = [
  "Technology", "Sports", "Gaming", "Art", "Music", "Reading", "Travel", 
  "Cooking", "Fitness", "Movies", "Fashion", "Photography", "Writing",
  "Science", "History", "Philosophy", "DIY", "Gardening"
];

function InterestsSkeleton() {
    return (
        <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-8">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
            </div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex flex-wrap gap-2">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
            </div>
        </div>
    );
}

export default function InterestsPage() {
    const { user: authUser, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchInterests() {
            if (!authUser) return;
            try {
                const interests = await getUserInterests(authUser.uid);
                setSelectedInterests(interests);
            } catch (error) {
                console.error("Failed to fetch interests:", error);
                toast({ title: "Error", description: "Could not load your interests.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            fetchInterests();
        }
    }, [authUser, authLoading, toast]);

    const handleToggleInterest = (interest: string) => {
        setSelectedInterests(prev => 
            prev.includes(interest) 
                ? prev.filter(item => item !== interest)
                : [...prev, interest]
        );
    };

    const handleSaveChanges = async () => {
        if (!authUser) return;
        setSaving(true);
        try {
            await updateUserSettings(authUser.uid, { interests: selectedInterests });
            toast({ title: "Success", description: "Your interests have been updated." });
        } catch (error) {
            console.error("Failed to save interests:", error);
            toast({ title: "Error", description: "Could not save your interests.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const availableInterests = useMemo(() => {
        return ALL_INTERESTS.filter(interest => !selectedInterests.includes(interest));
    }, [selectedInterests]);

    const profileLink = !authLoading && userProfile?.username ? `/profile/${userProfile.username}` : '/feed';

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
                    <h1 className="text-xl font-semibold mx-auto">Manage Interests</h1>
                    <Button onClick={handleSaveChanges} disabled={saving || loading} className="w-20">
                        {saving ? <Icons.spinner className="animate-spin h-5 w-5" /> : "Save"}
                    </Button>
                </header>

                <main className="flex-1 overflow-y-auto bg-background p-4">
                    {loading ? <InterestsSkeleton /> : (
                        <>
                            <div>
                                <h2 className="text-lg font-semibold mb-3 text-foreground">Your Interests</h2>
                                <div className="flex flex-wrap gap-2 min-h-[3rem] bg-muted/50 rounded-lg p-3">
                                    {selectedInterests.length > 0 ? (
                                        selectedInterests.map(interest => (
                                            <Badge 
                                                key={interest} 
                                                variant="default"
                                                className="cursor-pointer text-sm py-1 px-3 flex items-center gap-1.5"
                                                onClick={() => handleToggleInterest(interest)}
                                            >
                                                {interest}
                                                 <Icons.close className="h-3 w-3" />
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground p-2">Select your interests from the list below.</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8">
                                <h2 className="text-lg font-semibold mb-3 text-foreground">Available Interests</h2>
                                <div className="flex flex-wrap gap-2">
                                    {availableInterests.map(interest => (
                                        <Badge 
                                            key={interest} 
                                            variant="outline"
                                            className="cursor-pointer text-sm py-1 px-3"
                                            onClick={() => handleToggleInterest(interest)}
                                        >
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
