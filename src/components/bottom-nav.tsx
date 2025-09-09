
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/feed", icon: Icons.home, label: "Home" },
  { href: "/search", icon: Icons.search, label: "Discover" },
  { href: "/create", icon: Icons.plus, label: "Create", isCentral: true },
  { href: "/activity", icon: Icons.like, label: "Activity" },
  { href: "/profile", icon: Icons.profile, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { userProfile, isGuest } = useAuth();
  
  // Adjust profile link to point to the current user's profile
  const finalNavItems = navItems.map(item => {
    if (item.href === "/profile") {
      if (isGuest) return { ...item, href: "/login" };
      if (userProfile) {
        return { ...item, href: `/profile/${userProfile.username}` };
      }
      // Fallback if profile is somehow not loaded, though it should be.
      return { ...item, href: "/feed" };
    }
    return item;
  });


  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-background/80 backdrop-blur-lg border-t border-border/60">
            <nav className="flex items-center justify-around h-16">
            {finalNavItems.map(({ href, icon: Icon, label, isCentral }) => {
                const isActive = (href === "/feed" && pathname === href) || (href !== "/feed" && pathname.startsWith(href));
                if (isCentral) {
                    return (
                        <Button
                            key={label}
                            asChild
                            variant="default"
                            size="lg"
                            className="w-14 h-14 rounded-full bg-primary shadow-lg -translate-y-4"
                        >
                            <Link href={href}>
                                <Icon className="h-7 w-7" />
                                <span className="sr-only">{label}</span>
                            </Link>
                        </Button>
                    );
                }
                return (
                    <Link href={href} key={label}>
                        <div className={cn("flex flex-col items-center gap-1 p-2 text-muted-foreground", isActive && "text-primary")}>
                            <Icon className="h-6 w-6" />
                            <span className="text-xs">{label}</span>
                        </div>
                    </Link>
                );
            })}
            </nav>
        </div>
    </div>
  );
}
