"use client";

import { QrPreview } from "@/components/qr/qr-preview";
import { ArrowRight, RefreshCw, ScanLine } from "lucide-react";

/**
 * Simple visual demonstration: a QR code that resolves through a short link
 * to a destination website — the core OpenQR concept, in one glance.
 */
export function HeroDemo() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute inset-0 -z-10 bg-grid-dots opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
        {/* Step 1: printed QR */}
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border bg-card p-5 shadow-sm">
          <QrPreview data="https://demo.openqr.dev/r/a8F92k" pixelSize={124} />
          <div className="text-center">
            <p className="text-xs font-medium">Printed once</p>
            <code className="text-[11px] text-muted-foreground">/r/a8F92k</code>
          </div>
        </div>

        {/* Step 2: the dynamic redirect */}
        <div className="relative flex flex-col items-center">
          <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-medium shadow-sm">
            <ScanLine className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            302 redirect
          </div>
          <div className="mt-2 flex items-center text-muted-foreground">
            <span className="h-px w-10 bg-border sm:w-12" />
            <ArrowRight className="size-4 -ml-px" />
            <span className="h-px w-10 bg-border sm:w-12" />
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <RefreshCw className="size-3" />
            change anytime
          </p>
        </div>

        {/* Step 3: current destination */}
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border bg-card p-5 shadow-sm sm:w-44">
          <div className="flex h-[124px] w-full flex-col items-center justify-center gap-2 rounded-xl bg-muted/60 p-4">
            <div className="flex w-full items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 shadow-sm">
              <span className="size-1.5 rounded-full bg-red-400" />
              <span className="size-1.5 rounded-full bg-amber-400" />
              <span className="size-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-sm font-semibold tracking-tight">example.com</p>
            <p className="text-[10px] leading-tight text-muted-foreground text-center">
              Today&apos;s destination — update it whenever you like
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium">Points anywhere</p>
            <code className="text-[11px] text-muted-foreground">https://example.com</code>
          </div>
        </div>
      </div>
    </div>
  );
}
