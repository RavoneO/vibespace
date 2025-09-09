
import AppLayout from "@/components/app-layout";
import { ActivityFeed } from "./activity-feed";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getActivity, markAllActivitiesAsRead } from "@/services/activityService.server";
import { auth } from "@/lib/firebase";

function ActivitySkeleton() {
    return (
        <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-10 w-10" />
                </div>
            ))}
        </div>
    );
}

export default async function ActivityPage() {
  const authUser = auth.currentUser;
  
  let activities = [];
  if (authUser) {
      await markAllActivitiesAsRead(authUser.uid);
      activities = await getActivity(authUser.uid);
  }

  return (
    <AppLayout>
        <header className="flex items-center justify-between p-4 border-b">
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
              Activity
            </h1>
        </header>
        <Suspense fallback={<ActivitySkeleton />}>
            <ActivityFeed initialActivities={activities} />
        </Suspense>
    </AppLayout>
  );
}
