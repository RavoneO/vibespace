
"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { searchUsers, toggleFollow } from "@/services/userService";
import { semanticSearch, SemanticSearchOutput } from "@/ai/flows/ai-semantic-search";
import type { User, Post } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getPosts } from "@/services/postService";

function UserSearchResult({ user, currentUserId, onFollowToggle }: { user: User, currentUserId: string | null, onFollowToggle: (userId: string, isFollowing: boolean) => void }) {
    const { toast } = useToast();
    const { isGuest } = useAuth();
    const [isFollowing, setIsFollowing] = useState(user.followers?.includes(currentUserId || '') || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollow = async () => {
        if (!currentUserId || isGuest) {
            toast({ 
                title: "Please log in to follow users.", 
                variant: "destructive",
                action: <Link href="/signup"><Button>Sign Up</Button></Link>
            });
            return;
        }
        setIsLoading(true);
        try {
            const result = await toggleFollow(currentUserId, user.id);
            setIsFollowing(result);
            onFollowToggle(user.id, result);
        } catch (error) {
            toast({ title: "Something went wrong.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const isCurrentUser = user.id === currentUserId;

    return (
        <div className="flex items-center justify-between p-3 transition-colors hover:bg-secondary/50 rounded-lg -mx-3">
            <Link href={`/profile/${user.username}`} className="flex items-center gap-4 cursor-pointer">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
            </Link>
            {!isCurrentUser && (
                 <Button size="sm" onClick={handleFollow} disabled={isLoading || isGuest}>
                    {isLoading ? <Icons.spinner className="animate-spin" /> : (isFollowing ? "Following" : "Follow")}
                </Button>
            )}
        </div>
    );
}

function PostResultsSkeleton() {
    return (
         <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="relative aspect-square w-full overflow-hidden">
                    <Skeleton className="w-full h-full" />
                </div>
            ))}
        </div>
    )
}

function ExploreGrid({ posts }: { posts: Post[] }) {
    if (posts.length === 0) return <PostResultsSkeleton />;
    return (
        <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
                <Link href="#" key={post.id}>
                    <div className="relative aspect-square w-full overflow-hidden group">
                        <Image
                            src={post.contentUrl}
                            alt={post.caption}
                            fill
                            className="object-cover transition-all duration-300 group-hover:opacity-80"
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
                </Link>
            ))}
         </div>
    )
}

export function ExploreClient() {
  const { user: authUser } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 500);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<SemanticSearchOutput['results']>([]);
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const isLoading = isSearching || isTransitioning;

  // Fetch initial posts for explore view
  useEffect(() => {
    async function fetchInitialPosts() {
        const posts = await getPosts();
        // Shuffle posts for a more dynamic explore feed
        setExplorePosts(posts.sort(() => 0.5 - Math.random()));
    }
    fetchInitialPosts();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery) {
        setIsSearching(true);
        startTransition(async () => {
            const userPromise = searchUsers(debouncedQuery);
            const postPromise = semanticSearch({ query: debouncedQuery });
            
            const [users, posts] = await Promise.all([userPromise, postPromise]);
            
            setUserResults(users);
            setPostResults(posts.results || []);

            setIsSearching(false);
        });
      } else {
        setUserResults([]);
        setPostResults([]);
      }
    };
    if (debouncedQuery) {
        performSearch();
    }
  }, [debouncedQuery]);
  
  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    setUserResults(prevResults => prevResults.map(user => {
        if (user.id === userId && authUser) {
            const currentFollowers = user.followers || [];
            let newFollowers;
            if (isFollowing) {
                newFollowers = [...currentFollowers, authUser.uid];
            } else {
                newFollowers = currentFollowers.filter(id => id !== authUser.uid);
            }
            return { ...user, followers: newFollowers };
        }
        return user;
    }));
  };

  const showSearchResults = debouncedQuery.length > 0;

  return (
    <div>
      <div className="relative">
        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for posts, users..."
          className="w-full pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && <Icons.spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
      </div>

      <div className="mt-6">
        {showSearchResults ? (
             <div className="space-y-8">
                {isLoading && (
                    <>
                        <PostResultsSkeleton />
                    </>
                )}
                {!isLoading && userResults.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">Users</h2>
                        <div className="flex flex-col gap-2">
                            {userResults.map((user) => (
                            <UserSearchResult 
                                key={user.id} 
                                user={user} 
                                currentUserId={authUser?.uid || null}
                                onFollowToggle={handleFollowToggle} 
                            />
                            ))}
                        </div>
                    </div>
                )}
                
                {!isLoading && postResults.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">Posts</h2>
                        <div className="grid grid-cols-3 gap-1">
                            {postResults.map((post) => (
                                <Link href="#" key={post.id}>
                                    <div className="relative aspect-square w-full overflow-hidden group">
                                    <Image
                                        src={post.contentUrl}
                                        alt={post.caption}
                                        fill
                                        className="object-cover transition-all duration-300 group-hover:opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Icons.like className="h-5 w-5 fill-white" />
                                    </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && userResults.length === 0 && postResults.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No results found for "{debouncedQuery}"</p>
                        <p className="text-sm">Try searching for something else.</p>
                    </div>
                )}
            </div>
        ) : (
            <ExploreGrid posts={explorePosts} />
        )}
      </div>
    </div>
  );
}
