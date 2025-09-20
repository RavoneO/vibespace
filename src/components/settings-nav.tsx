
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./icons";

const links = [
    { name: "Account", href: "/settings", icon: Icons.profile },
    { name: "Payments", href: "/settings/payments", icon: Icons.billing },
];

export function SettingsNav() {
    const pathname = usePathname();
    return (
        <nav className="flex flex-col gap-1">
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === link.href && "bg-muted text-primary hover:text-primary",
                    )}
                >
                    <link.icon className="h-4 w-4" />
                    {link.name}
                </Link>
            ))}
        </nav>
    );
}
