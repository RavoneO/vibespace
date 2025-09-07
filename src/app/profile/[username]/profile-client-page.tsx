
"use client"
import AppLayout from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getUserByUsername, toggleFollow } from "@/services/userService";
import { getPostsByUserId, getSavedPosts } from "@/services/postService";
import type { User, Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { findOrCreateConversation } from "@/services/messageService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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


export function ProfileClientPage({ username }: { username: string }) {
  const { user: authUser, loading: authLoading, isGuest } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState({
      followers: 0,
      following: 0,
  });
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  const showLoginToast = useCallback(() => {
    toast({
        title: "Create an account to interact",
        description: "Sign up or log in to follow users and send messages.",
        variant: "destructive",
        action: <Link href="/signup"><Button>Sign Up</Button></Link>
    });
  }, [toast]);

  const fetchUserData = useCallback(async () => {
    try {
      const fetchedUser = await getUserByUsername(username);

      if (fetchedUser) {
        setUser(fetchedUser);
        const fetchedPosts = await getPostsByUserId(fetchedUser.id);
        setUserPosts(fetchedPosts);
        
        if (fetchedUser.savedPosts && fetchedUser.savedPosts.length > 0) {
            const fetchedSavedPosts = await getSavedPosts(fetchedUser.savedPosts);
            setSavedPosts(fetchedSavedPosts);
        }

        const followers = fetchedUser.followers?.length || 0;
        const following = fetchedUser.following?.length || 0;
        setFollowCount({ followers, following });
        
        if (authUser && !isGuest) {
          setIsFollowing(fetchedUser.followers?.includes(authUser.uid) || false);
        }
        setUserNotFound(false);
      } else {
        setUserNotFound(true);
      }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username, authUser, isGuest]);


  useEffect(() => {
    if (username) {
        setLoading(true);
        fetchUserData();
    }
  }, [username, fetchUserData]);
  
  useEffect(() => {
      if(user && authUser && !isGuest) {
          setIsFollowing(user.followers?.includes(authUser.uid) || false);
      }
      if(isGuest) {
          setIsFollowing(false);
      }
  }, [user, authUser, isGuest]);


  const handleFollowToggle = async () => {
    if (!authUser || isGuest) {
        showLoginToast();
        return;
    }
    if (!user) return;
    
    setIsFollowLoading(true);
    const originalIsFollowing = isFollowing;
    
    setIsFollowing(!originalIsFollowing);
    setFollowCount(prev => ({
        ...prev,
        followers: !originalIsFollowing ? prev.followers + 1 : prev.followers - 1
    }));

    try {
        await toggleFollow(authUser.uid, user.id);
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
    if (!authUser || isGuest) {
      showLoginToast();
      return;
    }
    if (!user) return;
    setIsMessageLoading(true);
    try {
        const conversationId = await findOrCreateConversation(authUser.uid, user.id);
        router.push(`/messages/${conversationId}`);
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
          description: `You have successfully simulated ${action.toLowerCase()}ing @${user?.username}. In a real app, this would trigger a backend process.`
      })
  }


  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (userNotFound) {
    notFound();
  }

  if (!user) {
    return <ProfilePageSkeleton />;
  }

  const isCurrentUserProfile = authUser?.uid === user.id;

  const stats = [
    { label: "Posts", value: userPosts.length },
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
                    <DropdownMenuItem onSelect={() => handleProfileAction("Block")} className="text-destructive">Block</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleProfileAction("Restrict")} className="text-destructive">Restrict</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleProfileAction("Report")} className="text-destructive">Report</DropdownMenuItem>
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
              <p className="text-sm text-muted-foreground">{user.bio}</p>
          </div>
          <div className="mt-4 flex gap-2">
            {isCurrentUserProfile ? (
              <Button asChild variant="secondary" className="flex-1">
                <Link href="/settings">Edit Profile</Link>
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
            </TabsList>
            <TabsContent value="posts" className="mt-0">
              {userPosts.filter(p => p.type === 'image').length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {userPosts.filter(p => p.type === 'image').map((post) => (
                    <div key={post.id} className="relative aspect-square w-full overflow-hidden group">
                      <Image
                        src={post.contentUrl}
                        alt={post.caption}
                        fill
                        className="object-cover transition-all duration-300 group-hover:opacity-80"
                        data-ai-hint={post.dataAiHint}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                          <div className="flex items-center gap-1 font-bold text-sm">
                              <Icons.like className="h-5 w-5 fill-white" /> {post.likes}
                          </div>
                          <div className="flex items-center gap-1 font-bold text-sm">
                              <Icons.comment className="h-5 w-5 fill-white" /> {post.comments.length}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-24">
                    <Icons.camera className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No posts yet</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="reels" className="mt-0">
                 {userPosts.filter(p => p.type === 'video').length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5">
                      {userPosts.filter(p => p.type === 'video').map((post) => (
                        <div key={post.id} className="relative aspect-[9/16] w-full overflow-hidden group">
                          <video
                            src={post.contentUrl}
                            className="object-cover w-full h-full transition-all duration-300"
                          />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icons.reels className="h-10 w-10 text-white" />
                           </div>
                          <div className="absolute bottom-2 left-2 text-white flex items-center gap-2 text-xs font-bold bg-black/30 rounded-full px-2 py-1">
                              <div className="flex items-center gap-1">
                                  <Icons.like className="h-4 w-4 fill-white" /> {post.likes}
                              </div>
                              <div className="flex items-center gap-1">
                                  <Icons.comment className="h-4 w-4 fill-white" /> {post.comments.length}
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-24">
                        <Icons.reels className="mx-auto h-12 w-12" />
                        <p className="mt-4 font-semibold">No reels yet</p>
                    </div>
                 )}
            </TabsContent>
            <TabsContent value="saved" className="mt-0">
               {isCurrentUserProfile ? (
                 savedPosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-0.5">
                      {savedPosts.map((post) => (
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
          </Tabs>
        </div>
      </main>
    </AppLayout>
  );
}
