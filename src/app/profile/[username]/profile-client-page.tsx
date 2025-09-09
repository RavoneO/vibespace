
"use client"
import AppLayout from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import type { User, Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { findOrCreateConversation } from "@/services/messageService.server";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserPosts, PostGridSkeleton } from "./user-posts";

interface ProfileClientPageProps {
  user: User;
  initialPosts: Post[];
  initialSavedPosts: Post[];
  initialLikedPosts: Post[];
}

async function callAiApi(action: string, payload: any) {
    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'AI API request failed');
    }

    return response.json();
}

function ProfilePageSkeleton() {
  return (
      <AppLayout>
          <main className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex items-center p-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-8 w-8 ml-auto" />
                </header>
                  <div className="flex items-center gap-6 sm:gap-10 p-4">
                      <Skeleton className="w-24 h-24 sm:w-36 sm:h-36 rounded-full" />
                      <div className="flex-1 flex justify-around text-center">
                         {[...Array(3)].map((_, i) => (
                          <div key={i} className="space-y-1">
                              <Skeleton className="h-6 w-12 mx-auto" />
                              <Skeleton className="h-4 w-16 mx-auto" />
                          </div>
                      ))}
                      </div>
                  </div>
                  <div className="px-4 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full max-w-prose" />
                  </div>
                   <div className="flex gap-2 p-4">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                    </div>

                   <div className="grid grid-cols-3 gap-1 mt-4">
                      {[...Array(6)].map((_, i) => (
                          <div key={i} className="relative aspect-square w-full overflow-hidden">
                              <Skeleton className="w-full h-full" />
                          </div>
                      ))}
                  </div>
              </div>
          </main>
      </AppLayout>
  )
}

export function ProfileClientPage({ user, initialPosts, initialSavedPosts, initialLikedPosts }: ProfileClientPageProps) {
  const { user: authUser, userProfile, loading: authLoading, isGuest } = useAuth();
  
  const { toast } = useToast();
  const router = useRouter();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState({
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
  });

  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [vibe, setVibe] = useState<string | null>(null);
  
  const isCurrentUserProfile = userProfile?.id === user.id;

  useEffect(() => {
    async function generateVibe() {
      if (initialPosts.length > 0) {
        try {
          const result = await callAiApi('generate-vibe', {
            captions: initialPosts.map(p => p.caption).filter(Boolean)
          });
          setVibe(result.vibe);
        } catch (error) {
          console.error("Error generating vibe:", error);
          setVibe("Adventurous Spirit ✨"); // Fallback vibe
        }
      }
    }
    generateVibe();
  }, [initialPosts]);

  const showLoginToast = useCallback(() => {
    toast({
        title: "Create an account to interact",
        description: "Sign up or log in to follow users and send messages.",
        variant: "destructive",
        action: <Link href="/signup"><Button>Sign Up</Button></Link>
    });
  }, [toast]);
  
  useEffect(() => {
    if(userProfile && !isGuest) {
      setIsFollowing(user.followers?.includes(userProfile.id) || false);
    } else {
      setIsFollowing(false);
    }
  }, [user, userProfile, isGuest]);

  const handleFollowToggle = async () => {
    if (!userProfile || isGuest) {
        showLoginToast();
        return;
    }
    
    setIsFollowLoading(true);
    const originalIsFollowing = isFollowing;
    
    setIsFollowing(!originalIsFollowing);
    setFollowCount(prev => ({
        ...prev,
        followers: !originalIsFollowing ? prev.followers + 1 : prev.followers - 1
    }));

    try {
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: userProfile.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle follow');
      }

      const { isFollowing: newIsFollowing } = await response.json();
      setIsFollowing(newIsFollowing);

    } catch (error) {
        setIsFollowing(originalIsFollowing);
        setFollowCount(prev => ({
            ...prev,
            followers: originalIsFollowing ? prev.followers - 1 : prev.followers + 1
        }));
        console.error("Error toggling follow:", error);
        toast({ title: "Something went wrong.", variant: "destructive" });
    } finally {
        setIsFollowLoading(false);
    }
  }

  const handleMessage = async () => {
    if (!userProfile || isGuest) {
      showLoginToast();
      return;
    }
    setIsMessageLoading(true);
    try {
        const conversationId = await findOrCreateConversation(userProfile.id, user.id);
        router.push(`/messages/chat?id=${conversationId}`);
    } catch (error) {
        console.error("Failed to start conversation", error);
        toast({ title: "Could not start conversation.", variant: "destructive" });
    } finally {
        setIsMessageLoading(false);
    }
  };

  const handleProfileAction = (action: "Block" | "Restrict" | "Report") => {
      toast({
          title: `${action} User`,
          description: `You have successfully simulated ${action.toLowerCase()}ing @${user.username}. In a real app, this would trigger a backend process.`
      })
  }

  if (authLoading) {
    return <ProfilePageSkeleton />;
  }

  const stats = [
    { label: "Posts", value: initialPosts.length },
    { label: "Followers", value: followCount.followers },
    { label: "Following", value: followCount.following },
  ];

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">@{user.username}</h1>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Icons.more />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {isCurrentUserProfile ? (
                         <DropdownMenuItem onSelect={() => router.push('/settings')}>
                            <Icons.settings className="mr-2" />
                            Settings
                        </DropdownMenuItem>
                    ) : (
                        <>
                        <DropdownMenuItem onSelect={() => handleProfileAction("Block")} className="text-destructive">Block</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleProfileAction("Restrict")} className="text-destructive">Restrict</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleProfileAction("Report")} className="text-destructive">Report</DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-6 sm:gap-10">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background ring-2 ring-primary">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-3xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex justify-around text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-bold text-lg">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
              {vibe ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-accent-foreground bg-accent/20 rounded-full px-3 py-1 w-fit">
                    <Icons.sparkles className="h-4 w-4 text-accent" />
                    <p className="font-medium">{vibe}</p>
                  </div>
              ) : (
                  <Skeleton className="h-5 w-48 mt-2" />
              )}
          </div>
          <div className="mt-4 flex gap-2">
            {isCurrentUserProfile ? (
              <Button asChild variant="secondary" className="flex-1">
                <Link href="/settings/profile">Edit Profile</Link>
              </Button>
            ) : (
              <>
                <Button onClick={handleFollowToggle} disabled={isFollowLoading || authLoading} className="flex-1">
                    {isFollowLoading ? <Icons.spinner className="animate-spin" /> : (isFollowing ? "Following" : "Follow")}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={handleMessage} disabled={isMessageLoading || authLoading}>
                   {isMessageLoading ? <Icons.spinner className="animate-spin" /> : "Message"}
                </Button>
              </>
            )}
          </div>
          
          <Tabs defaultValue="posts" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"><Icons.grid className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="reels" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"><Icons.reels className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"><Icons.bookmark className="h-5 w-5" /></TabsTrigger>
              {isCurrentUserProfile && (
                <TabsTrigger value="likes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"><Icons.liked className="h-5 w-5" /></TabsTrigger>
              )}
            </TabsList>
            <Suspense fallback={<PostGridSkeleton />}>
                <UserPosts posts={initialPosts} />
            </Suspense>
            <TabsContent value="saved" className="mt-0">
               {isCurrentUserProfile ? (
                 initialSavedPosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5">
                      {initialSavedPosts.map((post) => (
                        <div key={post.id} className="relative aspect-square w-full overflow-hidden group">
                           <Image
                                src={post.contentUrl}
                                alt={post.caption}
                                fill
                                className="object-cover transition-all duration-300 group-hover:opacity-80"
                                data-ai-hint={post.dataAiHint}
                            />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-24">
                        <Icons.bookmark className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">No saved posts</p>
                        <p className="text-sm">Save posts to see them here.</p>
                    </div>
                  )
               ) : (
                <div className="text-center text-muted-foreground py-24">
                    <Icons.lock className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">Saved Posts are Private</p>
                </div>
               )}
            </TabsContent>
            {isCurrentUserProfile && (
                <TabsContent value="likes" className="mt-0">
                    {initialLikedPosts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-0.5">
                            {initialLikedPosts.map((post) => (
                                <div key={post.id} className="relative aspect-square w-full overflow-hidden group">
                                    <Image
                                        src={post.contentUrl}
                                        alt={post.caption}
                                        fill
                                        className="object-cover transition-all duration-300 group-hover:opacity-80"
                                        data-ai-hint={post.dataAiHint}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-24">
                            <Icons.liked className="mx-auto h-12 w-12" />
                            <p className="mt-4 font-semibold">No liked posts yet</p>
                            <p className="text-sm">Posts you like will appear here.</p>
                        </div>
                    )}
                </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </AppLayout>
  );
}
