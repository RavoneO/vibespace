
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider>
      <div className={cn("flex min-h-screen", isMobile ? "bg-background" : "bg-page-background")}>
        <AppSidebar />
        <div className="flex flex-col flex-1 md:ml-[--sidebar-width-icon]">
          <div className="flex-1 w-full max-w-2xl mx-auto bg-background md:my-4 md:rounded-lg md:shadow-lg">
             {children}
          </div>
        </div>
        {isMobile && <BottomNav />}
      </div>
    </SidebarProvider>
  );
}
