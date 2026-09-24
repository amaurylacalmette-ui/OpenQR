import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/dashboard/mode-toggle";
import { Menu } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-lg font-semibold tracking-tight">OpenQR</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Site">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#self-host" className="transition-colors hover:text-foreground">
            Self-host
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Site sections">
            <a href="#features">
              <Menu className="size-5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
