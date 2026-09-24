"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function DashboardShell({
  name,
  email,
  children,
}: {
  name: string | null;
  email: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r bg-card/40">
        <div className="p-5">
          <Link href="/" className="flex items-center gap-2.5 px-1">
            <Logo className="size-8" />
            <span className="text-lg font-semibold tracking-tight">OpenQR</span>
          </Link>
        </div>
        <div className="px-4 flex-1">
          <SidebarNav />
        </div>
        <div className="p-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/qr-codes/new">
              <Plus className="size-4" />
              New QR Code
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 backdrop-blur px-4 h-14">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b p-5">
                <SheetTitle asChild>
                  <Link href="/" className="flex items-center gap-2.5">
                    <Logo className="size-8" />
                    <span className="text-lg font-semibold tracking-tight">OpenQR</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/qr-codes/new">
                    <Plus className="size-4" />
                    New QR Code
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="font-semibold tracking-tight">OpenQR</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ModeToggle />
          <UserNav name={name} email={email} />
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="hidden md:sticky md:top-0 md:z-40 md:flex md:items-center md:justify-between md:h-14 md:border-b md:bg-background/80 md:backdrop-blur md:pl-[calc(16rem+1.5rem)] lg:pl-[calc(16rem+2rem)] md:pr-6">
        <p className="text-sm text-muted-foreground px-1">
          Dynamic QR codes without the subscription
        </p>
        <div className="flex items-center gap-1.5">
          <ModeToggle />
          <UserNav name={name} email={email} />
        </div>
      </header>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8 pb-16">{children}</div>
      </main>
    </div>
  );
}
