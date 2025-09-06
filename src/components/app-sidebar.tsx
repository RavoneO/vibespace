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

export function AppSidebar() {
  const menuItems = [
    { href: "/", icon: Icons.home, label: "Home" },
    { href: "/search", icon: Icons.search, label: "Search" },
    { href: "/messages", icon: Icons.messages, label: "Messages" },
    { href: "/reels", icon: Icons.reels, label: "Reels" },
    { href: "/profile", icon: Icons.profile, label: "Profile" },
  ];

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
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Icons.create className="mr-2" />
                Create Post
            </Button>
        </Link>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{currentUser.name}</span>
            <span className="text-sm text-muted-foreground">@{currentUser.username}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
