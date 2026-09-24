"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  BarChart3,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const dashboardNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "QR Codes", href: "/dashboard/qr-codes", icon: QrCode },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5" aria-label="Main navigation">
      {dashboardNav.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
            )}
          >
            <Icon className={cn("size-4.5 shrink-0", active && "text-emerald-600 dark:text-emerald-400")} />
            {item.title}
            {active && (
              <span className="ml-auto size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
