import AppLayout from "@/components/app-layout";
import { Icons } from "@/components/icons";

export default function ReelsPage() {
  return (
    <AppLayout>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <Icons.reels className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-2xl font-bold text-foreground/90">Reels</h1>
          <p className="mt-2">This feature is coming soon. Stay tuned!</p>
        </div>
      </main>
    </AppLayout>
  );
}
