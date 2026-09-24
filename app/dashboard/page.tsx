import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  QrCode as QrCodeIcon,
  ScanLine,
  Users,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import {
  getDashboardOverview,
  getRangeStats,
  getSeries,
} from "@/lib/queries";
import { formatNumber, timeAgo, deviceLabel, countryFlag, countryName } from "@/lib/format";
import { StatCard, EmptyState } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScansChart, ChartLegend } from "@/components/analytics/scans-chart";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const overview = await getDashboardOverview(user.id);
  const [series, stats7d] = await Promise.all([
    getSeries({ userId: user.id }, "7d"),
    getRangeStats({ userId: user.id }, "7d"),
  ]);

  const hasQrCodes = overview.totalQrCodes > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {overview.totalQrCodes > 0 ? `Welcome back, ${user.name ?? "there"}` : "Welcome to OpenQR"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is what has been happening with your QR codes.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/qr-codes/new">
            <QrCodeIcon className="size-4" />
            Create QR Code
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total QR codes"
          value={formatNumber(overview.totalQrCodes)}
          hint={`${overview.activeQrCodes} active`}
          icon={QrCodeIcon}
        />
        <StatCard
          label="Total scans"
          value={formatNumber(overview.totalScans)}
          hint="All time"
          icon={ScanLine}
        />
        <StatCard
          label="Scans · last 7 days"
          value={formatNumber(overview.scans7d)}
          hint={`Daily average: ${overview.scans7d > 0 ? Math.round(overview.scans7d / 7) : 0}`}
          icon={BarChart3}
        />
        <StatCard
          label="Unique visitors · 7 days"
          value={formatNumber(stats7d.uniqueScans)}
          hint="Distinct devices, privacy-friendly"
          icon={Users}
        />
      </div>

      {hasQrCodes ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Scans over time</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </div>
              <ChartLegend />
            </CardHeader>
            <CardContent>
              <ScansChart data={series} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Top QR codes</CardTitle>
                <CardDescription>By total scans</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Link href="/dashboard/qr-codes">
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {overview.topQrCodes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No scans yet — share your codes to collect data.
                </p>
              ) : (
                overview.topQrCodes.map((qr, i) => (
                  <Link
                    key={qr.id}
                    href={`/dashboard/qr-codes/${qr.id}`}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
                  >
                    <span className="w-5 text-center text-xs font-semibold text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:underline">
                        {qr.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /r/{qr.shortCode}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="tabular-nums bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                    >
                      {formatNumber(qr.scanCount)} scans
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={QrCodeIcon}
          title="No QR codes yet"
          description="Create your first dynamic QR code — change its destination anytime without reprinting, and watch scan analytics roll in."
          action={
            <Button asChild>
              <Link href="/dashboard/qr-codes/new">
                <QrCodeIcon className="size-4" />
                Create your first QR code
              </Link>
            </Button>
          }
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent scans</CardTitle>
          <CardDescription>Latest activity across all of your codes</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.recentScans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No scans recorded yet. Scan one of your codes to see live data here.
            </p>
          ) : (
            <ul className="divide-y">
              {overview.recentScans.map((scan) => (
                <li key={scan.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-lg leading-none" title={countryName(scan.country)}>
                    {countryFlag(scan.country)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <Link
                        href={`/dashboard/qr-codes/${scan.qrCode.id}`}
                        className="font-medium hover:underline"
                      >
                        {scan.qrCode.name}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}· {deviceLabel(scan.deviceType)}
                        {scan.browser ? ` · ${scan.browser}` : ""}
                        {scan.os ? ` · ${scan.os}` : ""}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(scan.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
