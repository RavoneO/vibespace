
import AppLayout from "@/components/app-layout";
import { ActivityFeed } from "./activity-feed";

export default function ActivityPage() {
  return (
    <AppLayout>
        <header className="flex items-center justify-between p-4 border-b">
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
              Activity
            </h1>
        </header>
        <ActivityFeed />
    </AppLayout>
  );
}
