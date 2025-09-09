
"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import type { Activity } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from 'date-fns';

function ActivityItem({ activity }: { activity: Activity }) {
    const { actor, type, targetPost, timestamp } = activity;

    const formattedTimestamp = formatDistanceToNowStrict(timestamp.toDate(), { addSuffix: true });

    let message = "";
    switch (type) {
        case "like":
            message = "liked your post.";
            break;
        case "comment":
            message = "commented on your post.";
            break;
        case "follow":
            message = "started following you.";
            break;
        case "mention":
            message = "mentioned you in a post.";
            break;
        default:
            return null;
    }

    const href = type === 'follow' ? `/profile/${actor.username}` : `/post/${targetPost?.id}`;

    return (
         <Link href={href} className="block hover:bg-muted/50">
            <div className="flex items-center gap-4 px-4 py-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={actor.avatar} />
                    <AvatarFallback>{actor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                    <p>
                        <span className="font-semibold">{actor.username}</span> {message}
                        <span className="text-muted-foreground ml-2">{formattedTimestamp}</span>
                    </p>
                </div>
                {targetPost && (
                    <div className="w-10 h-10 relative">
                        {targetPost.type === 'image' ? (
                            <Image src={targetPost.contentUrl} alt="Post thumbnail" fill className="object-cover rounded" />
                        ) : (
                             <video src={targetPost.contentUrl} className="object-cover rounded w-full h-full" />
                        )}
                    </div>
                )}
            </div>
        </Link>
    )
}

export function ActivityFeed({ initialActivities }: { initialActivities: Activity[] }) {
    const { isGuest } = useAuth();
    
    if (isGuest) {
      return (
          <div className="text-center text-muted-foreground py-24 px-4">
            <Icons.notifications className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">Activity is for users only</p>
            <p className="text-sm">Sign up or log in to see your notifications.</p>
            <Button asChild className="mt-4">
                <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
      )
  }

  if (initialActivities.length === 0) {
       return (
          <div className="text-center text-muted-foreground py-24 px-4">
            <Icons.notifications className="mx-auto h-12 w-12" />
            <p className="mt-4 font-semibold">No activity yet</p>
            <p className="text-sm">When someone likes your post or follows you, you'll see it here.</p>
          </div>
        )
  }

  return (
    <div className="divide-y">
        {initialActivities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
        ))}
    </div>
  )
}
