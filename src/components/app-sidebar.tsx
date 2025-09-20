
"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";
import { useRouter, usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { auth } from "@/lib/firebase";


export function AppSidebar() {
  const { user, userProfile, loading: authLoading, isGuest } = useAuth();
  const { hasUnreadNotifications } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const { state: sidebarState, toggleSidebar } = useSidebar();

  const menuItems = [
    { href: "/feed", icon: Icons.home, label: "Home" },
    { href: "/search", icon: Icons.search, label: "Search" },
    { href: "/reels", icon: Icons.reels, label: "Reels" },
    { href: "/activity", icon: Icons.like, label: "Activity", hasNotification: hasUnreadNotifications },
    { href: "/messages", icon: Icons.messages, label: "Messages" },
    { href: "/profile", icon: Icons.profile, label: "Profile" },
  ];

  const handleLogout = () => auth.signOut().then(() => router.push('/'));

  return (
    <Sidebar>
      <SidebarHeader>
        <div className={cn("flex items-center gap-2", sidebarState === 'expanded' ? "p-4" : "p-4 justify-center")}>
          <div className="p-2 rounded-lg bg-primary">
            <Icons.sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
           {sidebarState === 'expanded' && <h1 className="text-xl font-semibold">Vibespace</h1>}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => {
             const finalHref = item.href === '/profile' && userProfile ? `/profile/${userProfile.username}` : item.href;
             const isActive = !!((item.href === "/feed" && pathname === item.href) || (item.href !== "/feed" && pathname.startsWith(item.href) && item.href !== "/profile") || (item.href === "/profile" && userProfile && pathname.startsWith(`/profile/${userProfile.username}`)));
             
             return (
                 <SidebarMenuItem key={item.label}>
                    <Link href={finalHref} className="w-full">
                        <SidebarMenuButton
                        className="w-full justify-start relative"
                        variant="default"
                        size="lg"
                        isActive={isActive}
                        tooltip={item.label}
                        >
                        <item.icon className="size-5 mr-3" />
                        <span>{item.label}</span>
                         {item.hasNotification && (
                            <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                        )}
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
             )
          })}
        </SidebarMenu>
        <Link href="/create" className="mt-8 px-2">
            <Button size="lg" className={cn("w-full text-lg", sidebarState === 'collapsed' && 'h-12 w-12 p-0')}>
                <Icons.create className={cn("mr-2", sidebarState === 'collapsed' && 'mr-0')} />
                {sidebarState === 'expanded' && 'Create'}
            </Button>
        </Link>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t mt-auto">
        { authLoading ? (
            <div className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className={cn("flex-1 space-y-1", sidebarState === 'collapsed' && 'hidden')}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        ) : user && userProfile ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer w-full p-2 hover:bg-secondary rounded-md">
                    <Avatar>
                        <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                        <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("flex flex-col overflow-hidden flex-1", sidebarState === 'collapsed' && 'hidden')}>
                        <span className="font-semibold truncate">{userProfile.name}</span>
                        <span className="text-sm text-muted-foreground truncate">@{userProfile.username}</span>
                    </div>
                    <Icons.more className={cn("text-muted-foreground", sidebarState === 'collapsed' && 'hidden')} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2">
                 <DropdownMenuItem onClick={() => router.push('/settings')}>
                   <Icons.settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/settings/payments')}>
                   <Icons.billing className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleLogout}>
                   <Icons.logout className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            <div className={cn("text-center space-y-2", sidebarState === 'collapsed' && "hidden")}>
                <p className="text-sm">Sign in to get the full experience.</p>
                <Button size="sm" className="w-inll" onClick={() => router.push('/login')}>
                    Sign In
                </Button>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
