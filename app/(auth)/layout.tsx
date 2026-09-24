import Link from "next/link";
import { Logo } from "@/components/logo";
import { Globe2, BarChart3, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden bg-zinc-950 text-zinc-50 flex-col justify-between p-10">
        <div className="absolute inset-0 bg-grid-dots opacity-40 [background-size:28px_28px]" />
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5 w-fit">
          <Logo className="size-9" />
          <span className="text-xl font-semibold tracking-tight">OpenQR</span>
        </Link>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Dynamic QR codes without the subscription.
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            Create a QR code once, point it anywhere, and update the destination
            whenever you need — the printed code never changes.
          </p>
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-start gap-3">
              <Globe2 className="size-4 mt-0.5 text-emerald-400 shrink-0" />
              <span><span className="font-medium text-zinc-200">Edit destinations anytime</span> — no reprinting, no regeneration</span>
            </li>
            <li className="flex items-start gap-3">
              <BarChart3 className="size-4 mt-0.5 text-emerald-400 shrink-0" />
              <span><span className="font-medium text-zinc-200">Scan analytics</span> — devices, countries, referrers over time</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="size-4 mt-0.5 text-emerald-400 shrink-0" />
              <span><span className="font-medium text-zinc-200">Privacy-friendly &amp; self-hosted</span> — you own the data</span>
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">
          Self-hostable in minutes · Privacy-friendly analytics
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 mb-10 w-fit"
          >
            <Logo className="size-8" />
            <span className="text-lg font-semibold tracking-tight">OpenQR</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
