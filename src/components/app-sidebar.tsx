
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
} from "@/components/ui/sidebar";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { getUserById } from "@/services/userService";
import { Skeleton } from "./ui/skeleton";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

export function AppSidebar() {
  const { user: authUser, isGuest, setAsGuest } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const router = useRouter();

  const menuItems = [
    { href: "/feed", icon: Icons.home, label: "Home" },
    { href: "/search", icon: Icons.search, label: "Search" },
    { href: "/messages", icon: Icons.messages, label: "Messages" },
    { href: "/reels", icon: Icons.reels, label: "Reels" },
    { href: "/profile", icon: Icons.profile, label: "Profile" },
  ];

  useEffect(() => {
    async function fetchUserProfile() {
        if (authUser && !isGuest) {
            setIsLoadingProfile(true);
            try {
              const profile = await getUserById(authUser.uid);
              setUserProfile(profile);
            } catch (error) {
              console.error("Error fetching user profile", error);
              setUserProfile(null);
            } finally {
              setIsLoadingProfile(false);
            }
        } else {
            setUserProfile(null);
            setIsLoadingProfile(false);
        }
    }
    fetchUserProfile();
  }, [authUser, isGuest]);

  const handleLogout = async () => {
    await signOut(auth);
    setAsGuest(false); // Ensure guest status is cleared
    router.push("/"); // Redirect to welcome page after logout
  }

  const handleGuestLogin = () => {
    setAsGuest(false); // Clear guest status
    router.push("/login");
  }

  const handleGuestSignup = () => {
    setAsGuest(false); // Clear guest status
    router.push("/signup");
  }


  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary">
            <Icons.sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Vibespace</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} className="w-full">
                <SidebarMenuButton
                  className="w-full justify-start"
                  variant="ghost"
                  size="lg"
                >
                  <item.icon className="size-5 mr-2 text-accent" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <Link href="/create" className="mt-8">
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isGuest}>
                <Icons.create className="mr-2" />
                Create Post
            </Button>
        </Link>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        { isGuest ? (
            <div className="text-center space-y-2">
                <p className="text-sm">Sign up to get the full experience.</p>
                <Button size="sm" className="w-full" onClick={handleGuestSignup}>
                    Sign Up
                </Button>
                 <Button size="sm" variant="outline" className="w-full" onClick={handleGuestLogin}>
                    Log In
                </Button>
            </div>
        ) : isLoadingProfile ? (
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        ) : userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer w-full">
                    <Avatar>
                        <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                        <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden flex-1">
                        <span className="font-semibold truncate">{userProfile.name}</span>
                        <span className="text-sm text-muted-foreground truncate">@{userProfile.username}</span>
                    </div>
                    <Icons.more className="text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2">
                 <DropdownMenuItem onClick={handleLogout}>
                   <Icons.logout className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        ) : (
             <div className="text-center">
                <p className="text-sm mb-2">Please log in to continue.</p>
                 <Link href="/login">
                    <Button size="sm" variant="outline" className="w-full">
                        Log In
                    </Button>
                </Link>
            </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
