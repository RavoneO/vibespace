
"use client"
import AppLayout from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserByUsername, toggleFollow } from "@/services/userService";
import { getPostsByUserId } from "@/services/postService";
import type { User, Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { findOrCreateConversation } from "@/services/messageService";


export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { user: authUser, isGuest } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState({
      followers: 0,
      following: 0,
  });
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  const showLoginToast = () => {
    toast({
        title: "Create an account to interact",
        description: "Sign up or log in to follow users and send messages.",
        variant: "destructive",
        action: <Link href="/signup"><Button>Sign Up</Button></Link>
    });
  }

  useEffect(() => {
    const fetchUserData = async () => {
      if (!params.username) return;
      setLoading(true);
      setUserNotFound(false);

      try {
        const fetchedUser = await getUserByUsername(params.username);

        if (fetchedUser) {
          setUser(fetchedUser);
          const fetchedPosts = await getPostsByUserId(fetchedUser.id);
          setUserPosts(fetchedPosts);
          
          const followers = fetchedUser.followers?.length || 0;
          const following = fetchedUser.following?.length || 0;
          setFollowCount({ followers, following });

          if (authUser) {
            setIsFollowing(fetchedUser.followers?.includes(authUser.uid) || false);
          }
        } else {
          console.error("User not found.");
          setUserNotFound(true);
        }
      } catch (error) {
          console.error("Failed to fetch user data:", error);
          setUserNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params.username, authUser]);

  const handleFollowToggle = async () => {
    if (!authUser || isGuest) {
        showLoginToast();
        return;
    }
    if (!user) return;
    
    setIsFollowLoading(true);
    try {
        const result = await toggleFollow(authUser.uid, user.id);
        setIsFollowing(result);
        setFollowCount(prev => ({
            ...prev,
            followers: result ? prev.followers + 1 : prev.followers - 1
        }));

    } catch (error) {
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


  if (loading) {
    return (
        <AppLayout>
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
                        <Skeleton className="w-24 h-24 sm:w-36 sm:h-36 rounded-full" />
                        <div className="flex-1 space-y-3 text-center sm:text-left">
                            <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
                            <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                            <Skeleton className="h-12 w-full max-w-prose" />
                            <div className="flex justify-center sm:justify-start gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-24" />
                            </div>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex justify-around text-center">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-1">
                                <Skeleton className="h-6 w-12 mx-auto" />
                                <Skeleton className="h-4 w-16 mx-auto" />
                            </div>
                        ))}
                    </div>
                     <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4 mt-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="relative aspect-square w-full overflow-hidden rounded-md">
                                <Skeleton className="w-full h-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </AppLayout>
    )
  }

  if (userNotFound) {
    notFound();
  }

  if (!user) {
    // This case should ideally not be reached if loading and notFound are handled correctly,
    // but it's a good fallback.
    return null; 
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
        <div className="max-w-4xl mx-auto">
        <header className="flex items-center p-4">
            <h1 className="text-lg font-semibold flex-1">@{user.username}</h1>
            <div className="flex items-center gap-2">
                {isCurrentUserProfile && (
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/settings">
                            <Icons.settings className="h-5 w-5" />
                            <span className="sr-only">Settings</span>
                        </Link>
                    </Button>
                )}
            </div>
        </header>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
              <Avatar className="w-24 h-24 sm:w-36 sm:h-36 border-4 border-background ring-2 ring-primary">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-4xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                <p className="mt-3 text-sm max-w-prose">{user.bio}</p>
                <div className="mt-4 flex justify-center sm:justify-start">
                    {!isCurrentUserProfile && (
                       <>
                        <Button onClick={handleFollowToggle} disabled={isFollowLoading}>
                            {isFollowLoading ? <Icons.spinner className="animate-spin" /> : (isFollowing ? "Following" : "Follow")}
                        </Button>
                        <Button variant="outline" className="ml-2" onClick={handleMessage} disabled={isMessageLoading}>
                           {isMessageLoading ? <Icons.spinner className="animate-spin" /> : "Message"}
                        </Button>
                       </>
                    )}
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex justify-around text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-bold text-lg">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts"><Icons.create className="mr-2 h-4 w-4" /> Posts</TabsTrigger>
              <TabsTrigger value="reels"><Icons.reels className="mr-2 h-4 w-4" /> Reels</TabsTrigger>
              <TabsTrigger value="tagged"><Icons.bookmark className="mr-2 h-4 w-4" /> Tagged</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="p-2 sm:p-4">
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
                {userPosts.map((post) => (
                  <div key={post.id} className="relative aspect-square w-full overflow-hidden rounded-md group">
                    <Image
                      src={post.contentUrl}
                      alt={post.caption}
                      fill
                      className="object-cover transition-all duration-300 group-hover:opacity-80 group-hover:scale-110"
                      data-ai-hint={post.dataAiHint}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <div className="flex items-center gap-1 font-bold">
                            <Icons.like className="h-5 w-5 fill-white" /> {post.likes}
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                            <Icons.comment className="h-5 w-5 fill-white" /> {post.comments.length}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="reels">
                <div className="text-center text-muted-foreground py-24">
                    <Icons.reels className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No reels yet</p>
                </div>
            </TabsContent>
            <TabsContent value="tagged">
                <div className="text-center text-muted-foreground py-24">
                    <Icons.bookmark className="mx-auto h-12 w-12" />
                    <p className="mt-4 font-semibold">No tagged posts</p>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AppLayout>
  );
}

    