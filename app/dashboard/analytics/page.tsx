import type { Metadata } from "next";
import { ScanLine, Users, MousePointerClick, TrendingUp } from "lucide-react";

import { requireUser } from "@/lib/auth";
import {
  getRangeStats,
  getSeries,
  getBreakdowns,
  rangeStart,
  type DateRange,
} from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import { StatCard, EmptyState } from "@/components/shared";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { ScansChart, ChartLegend } from "@/components/analytics/scans-chart";
import { BreakdownGrid } from "@/components/analytics/breakdown-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode as QrCodeIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Analytics" };

const VALID_RANGES: DateRange[] = ["today", "7d", "30d", "all"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser();
  const { range: rangeParam } = await searchParams;
  const range: DateRange = VALID_RANGES.includes(rangeParam as DateRange)
    ? (rangeParam as DateRange)
    : "30d";

  const [stats, series, breakdowns, qrCount, statsToday, stats7d] = await Promise.all([
    getRangeStats({ userId: user.id }, range),
    getSeries({ userId: user.id }, range),
    getBreakdowns({
      ...(range === "all" ? {} : { createdAt: { gte: rangeStart(range)! } }),
    }),
    db.qRCode.count({ where: { userId: user.id } }),
    getRangeStats({ userId: user.id }, "today"),
    getRangeStats({ userId: user.id }, "7d"),
  ]);

  if (qrCount === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan activity across all of your QR codes.
          </p>
        </div>
        <EmptyState
          icon={QrCodeIcon}
          title="Nothing to analyze yet"
          description="Create a QR code first — once people start scanning, country, device, browser and referrer breakdowns will appear here."
          action={
            <Button asChild>
              <Link href="/dashboard/qr-codes/new">Create your first QR code</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan activity across all of your QR codes, aggregated anonymously.
          </p>
        </div>
        <RangeTabs current={range} basePath="/dashboard/analytics" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total scans"
          value={formatNumber(stats.totalScans)}
          hint="Selected period"
          icon={ScanLine}
        />
        <StatCard
          label="Unique scans"
          value={formatNumber(stats.uniqueScans)}
          hint="Distinct devices (hashed IP)"
          icon={Users}
        />
        <StatCard
          label="Scans today"
          value={formatNumber(statsToday.totalScans)}
          hint="Since midnight"
          icon={MousePointerClick}
        />
        <StatCard
          label="Scans last 7 days"
          value={formatNumber(stats7d.totalScans)}
          hint="Rolling week"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Scans over time</CardTitle>
            <CardDescription>
              {range === "today"
                ? "Hourly buckets"
                : range === "all"
                  ? "Monthly buckets for long histories"
                  : "Daily buckets"}
            </CardDescription>
          </div>
          <ChartLegend />
        </CardHeader>
        <CardContent>
          <ScansChart data={series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audience</CardTitle>
          <CardDescription>
            Where scans come from and with what. No cookies, no fingerprints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BreakdownGrid
            countries={breakdowns.countries}
            devices={breakdowns.devices}
            browsers={breakdowns.browsers}
            oses={breakdowns.oses}
            referrers={breakdowns.referrers}
            total={stats.totalScans}
          />
        </CardContent>
      </Card>
    </div>
  );
}
