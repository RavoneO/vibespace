
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
import { currentUser } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const { user, isGuest, setAsGuest } = useAuth();

  const menuItems = [
    { href: "/feed", icon: Icons.home, label: "Home" },
    { href: "/search", icon: Icons.search, label: "Search" },
    { href: "/messages", icon: Icons.messages, label: "Messages" },
    { href: "/reels", icon: Icons.reels, label: "Reels" },
    { href: "/profile", icon: Icons.profile, label: "Profile" },
  ];

  const handleLogout = () => {
    setAsGuest(false);
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
            <div className="text-center">
                <p className="text-sm mb-2">Sign up to get the full experience.</p>
                 <Link href="/signup" onClick={handleLogout}>
                    <Button size="sm" className="w-full">
                        Sign Up
                    </Button>
                </Link>
            </div>
        ) : user ? (
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={user.photoURL || currentUser.avatar} alt={user.displayName || currentUser.name} />
                    <AvatarFallback>{(user.displayName || currentUser.name).charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold truncate">{user.displayName || currentUser.name}</span>
                    <span className="text-sm text-muted-foreground truncate">@{user.email?.split('@')[0] || currentUser.username}</span>
                </div>
            </div>
        ) : (
             <div className="text-center">
                <p className="text-sm mb-2">Log in to continue.</p>
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
