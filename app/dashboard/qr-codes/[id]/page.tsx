import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScanLine, Users, CalendarDays, LinkIcon } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getBaseUrl, redirectUrlFor } from "@/lib/qr";
import { getQrCodeById, getRangeStats, getSeries, getBreakdowns, type DateRange } from "@/lib/queries";
import { formatDate, formatNumber } from "@/lib/format";
import { DetailActions } from "@/components/qr/detail-actions";
import { EditQrForm } from "@/components/qr/edit-qr-form";
import { QrCustomizerCard } from "@/components/qr/qr-customizer";
import { RangeTabs } from "@/components/analytics/range-tabs";
import { ScansChart, ChartLegend } from "@/components/analytics/scans-chart";
import { BreakdownGrid } from "@/components/analytics/breakdown-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Params = Promise<{ id: string }>;
type Search = Promise<{ range?: string }>;

const VALID_RANGES: DateRange[] = ["today", "7d", "30d", "all"];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const qr = await getQrCodeById(user.id, id);
  return { title: qr ? qr.name : "QR Code" };
}

export default async function QrCodeDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const [{ id }, { range: rangeParam }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const qr = await getQrCodeById(user.id, id);
  if (!qr) notFound();

  const range: DateRange = VALID_RANGES.includes(rangeParam as DateRange)
    ? (rangeParam as DateRange)
    : "30d";

  const baseUrl = await getBaseUrl();
  const redirectUrl = redirectUrlFor(baseUrl, qr.shortCode);

  const [stats, series, breakdowns] = await Promise.all([
    getRangeStats({ qrCodeId: qr.id }, range),
    getSeries({ qrCodeId: qr.id }, range),
    getBreakdowns({
      qrCodeId: qr.id,
      ...(range === "all" ? {} : { createdAt: { gte: rangeStartOf(range) } }),
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/dashboard/qr-codes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All QR codes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {qr.name}
              </h1>
              {qr.isActive ? (
                <Badge variant="outline" className="gap-1.5 border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-zinc-400" />
                  Disabled
                </Badge>
              )}
            </div>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <LinkIcon className="size-3.5 shrink-0" />
              <span className="font-mono">{redirectUrl}</span>
              <span>→</span>
              <span className="max-w-64 truncate">{qr.destinationUrl}</span>
            </p>
          </div>
          <DetailActions qrCodeId={qr.id} name={qr.name} isActive={qr.isActive} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: edit + analytics */}
        <div className="space-y-6 lg:col-span-3">
          <EditQrForm
            qrCodeId={qr.id}
            name={qr.name}
            destinationUrl={qr.destinationUrl}
            description={qr.description}
            isActive={qr.isActive}
          />

          <Card id="analytics" className="scroll-mt-20">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    {formatNumber(qr.scanCount)} total scans since{" "}
                    {formatDate(qr.createdAt)}
                  </CardDescription>
                </div>
                <RangeTabs current={range} basePath={`/dashboard/qr-codes/${qr.id}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ScanLine className="size-3.5" />
                    Scans in period
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatNumber(stats.totalScans)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="size-3.5" />
                    Unique visitors
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatNumber(stats.uniqueScans)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-7">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Scans over time</p>
                  <ChartLegend />
                </div>
                <ScansChart data={series} height={240} />
              </div>
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

        {/* Right column: QR appearance & downloads */}
        <div className="space-y-6 lg:col-span-2">
          <QrCustomizerCard
            qrCodeId={qr.id}
            shortCode={qr.shortCode}
            redirectUrl={redirectUrl}
            foregroundColor={qr.foregroundColor}
            backgroundColor={qr.backgroundColor}
            size={qr.size}
            errorCorrection={qr.errorCorrection}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-muted-foreground" />
                Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Short code</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {qr.shortCode}
                </code>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(qr.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Last updated</span>
                <span>{formatDate(qr.updatedAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Error correction</span>
                <span>{qr.errorCorrection}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function rangeStartOf(range: DateRange): Date {
  const now = new Date();
  const d = new Date(now);
  switch (range) {
    case "today":
      d.setHours(0, 0, 0, 0);
      return d;
    case "7d":
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    case "30d":
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    default:
      d.setFullYear(d.getFullYear() - 10);
      return d;
  }
}
