
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { searchUsers, toggleFollow } from "@/services/userService";
import type { User } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

function UserSearchResult({ user, currentUserId, onFollowToggle }: { user: User, currentUserId: string | null, onFollowToggle: (userId: string, isFollowing: boolean) => void }) {
    const { toast } = useToast();
    const [isFollowing, setIsFollowing] = useState(user.followers?.includes(currentUserId || '') || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollow = async () => {
        if (!currentUserId) {
            toast({ title: "Please log in to follow users.", variant: "destructive" });
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
        <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <Link href={`/profile/${user.username}`} className="flex items-center gap-4 cursor-pointer">
                <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
            </Link>
            {!isCurrentUser && (
                 <Button size="sm" onClick={handleFollow} disabled={isLoading}>
                    {isLoading ? <Icons.spinner className="animate-spin" /> : (isFollowing ? "Following" : "Follow")}
                </Button>
            )}
        </div>
    );
}

export function SearchUsers() {
  const { user: authUser } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery) {
        setIsLoading(true);
        const users = await searchUsers(debouncedQuery);
        setResults(users);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    };
    performSearch();
  }, [debouncedQuery]);
  
  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    setResults(prevResults => prevResults.map(user => {
        if (user.id === userId) {
            const currentFollowers = user.followers || [];
            let newFollowers;
            if (isFollowing) {
                newFollowers = [...currentFollowers, authUser!.uid];
            } else {
                newFollowers = currentFollowers.filter(id => id !== authUser!.uid);
            }
            return { ...user, followers: newFollowers };
        }
        return user;
    }));
  };

  return (
    <div>
      <div className="relative">
        <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for users..."
          className="w-full pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                    </div>
                </div>
            ))}
          </div>
        ) : debouncedQuery && results.length > 0 ? (
          <div className="flex flex-col gap-4">
            {results.map((user) => (
              <UserSearchResult 
                key={user.id} 
                user={user} 
                currentUserId={authUser?.uid || null}
                onFollowToggle={handleFollowToggle} 
              />
            ))}
          </div>
        ) : debouncedQuery && results.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>No users found for "{debouncedQuery}"</p>
          </div>
        ) : !debouncedQuery ? (
          <div className="text-center text-muted-foreground py-10">
            <Icons.search className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">Find new people</p>
            <p className="text-sm">Search by name or username.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
