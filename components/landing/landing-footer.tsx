import Link from "next/link";
import { Logo } from "@/components/logo";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Logo className="size-7" />
              <span className="font-semibold tracking-tight">OpenQR</span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              A self-hostable dynamic QR code platform. Your codes, your data,
              your server.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Footer">
            <Link href="/register" className="transition-colors hover:text-foreground">
              Get Started
            </Link>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#self-host" className="transition-colors hover:text-foreground">
              Self-host
            </a>
          </nav>
        </div>
        <p className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} OpenQR · Built with Next.js, Prisma & PostgreSQL
        </p>
      </div>
    </footer>
  );
}
