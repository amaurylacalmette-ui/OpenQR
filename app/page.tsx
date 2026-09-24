import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Check,
  Globe2,
  Server,
  ShieldCheck,
  Download,
  QrCode as QrCodeIcon,
} from "lucide-react";

import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HeroDemo } from "@/components/landing/hero-demo";
import { CopyButton } from "@/components/qr/copy-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "OpenQR — Dynamic QR codes without the subscription",
};

const COMPOSE_SNIPPET = `cp .env.example .env
docker compose up -d`;

const FEATURES = [
  { icon: Globe2, title: "Dynamic destinations" },
  { icon: BarChart3, title: "Scan analytics" },
  { icon: ShieldCheck, title: "Privacy-friendly" },
  { icon: Server, title: "Self-hosted" },
  { icon: QrCodeIcon, title: "Customizable" },
  { icon: Download, title: "PNG & SVG exports" },
];

const STEPS = [
  {
    title: "Create a QR code",
    description:
      "Name it and set a destination URL. OpenQR generates a short link and renders the code.",
  },
  {
    title: "Print & distribute it",
    description:
      "Download the PNG or SVG. The encoded link never changes.",
  },
  {
    title: "Update or track it",
    description:
      "Point the short link at a new destination anytime and watch scans arrive in your dashboard.",
  },
];

export default function LandingPage() {
  return (
    <>
      <LandingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute -top-40 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <Badge
                variant="outline"
                className="mb-5 gap-1.5 border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
              >
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Open source · Self-hostable
              </Badge>
              <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Dynamic QR codes{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  without the subscription
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Create a QR code once, change its destination anytime, and
                track scans with privacy-friendly analytics.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 sm:w-auto"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>

            <div className="mt-14 sm:mt-20">
              <HeroDemo />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Features
              </h2>
            </div>
            <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <li
                  key={f.title}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10">
                    <f.icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium">{f.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                How it works
              </h2>
            </div>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative rounded-xl border bg-card p-6">
                  <span className="absolute -top-3.5 left-6 flex size-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white shadow">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Self-host */}
        <section id="self-host" className="scroll-mt-20 border-t bg-muted/20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Self-hosting
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                OpenQR ships as a single Docker Compose stack: the Next.js
                application plus a PostgreSQL database. Copy the environment
                file, and run{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  docker compose up -d
                </code>
                . That&apos;s the whole deployment.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  "Works behind your existing reverse proxy (Caddy, Nginx, Traefik)",
                  "PostgreSQL included, schema migrations via Prisma",
                  "Runs on a small VPS",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-muted-foreground">{line}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <Card className="gap-0 overflow-hidden py-0">
              <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-muted-foreground">
                  terminal
                </span>
              </div>
              <CardContent className="p-0">
                <pre className="overflow-x-auto bg-zinc-950 p-5 text-[13px] leading-relaxed text-zinc-100">
                  <code>
                    <span className="text-zinc-500"># Run the full stack</span>
                    {"\n"}cp .env.example .env
                    {"\n"}
                    <span className="text-emerald-400">docker compose up -d</span>
                    {"\n\n"}
                    <span className="text-zinc-500"># OpenQR is now on http://localhost:3000</span>
                  </code>
                </pre>
                <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Or download just the compose file:
                  </p>
                  <CopyButton value={COMPOSE_SNIPPET} label="Copy" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Create your first QR code
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full gap-2 sm:w-auto">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  );
}
