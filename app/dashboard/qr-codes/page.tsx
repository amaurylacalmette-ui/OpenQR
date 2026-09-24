import type { Metadata } from "next";
import Link from "next/link";
import { QrCode as QrCodeIcon, Plus, BarChart3 } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getQrCodesForUser } from "@/lib/queries";
import { getBaseUrl, redirectUrlFor } from "@/lib/qr";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/shared";
import { QueryToast } from "@/components/query-toast";
import { CopyButton } from "@/components/qr/copy-button";
import { QrRowActions } from "@/components/qr/qr-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "QR Codes" };

export default async function QrCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const user = await requireUser();
  const [{ deleted }, codes, baseUrl] = await Promise.all([
    searchParams,
    getQrCodesForUser(user.id),
    getBaseUrl(),
  ]);

  return (
    <div className="space-y-6">
      {deleted === "1" ? (
        <QueryToast param={deleted} message="QR code deleted" />
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">QR Codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {codes.length === 0
              ? "Create, manage and track your dynamic QR codes."
              : `You have ${codes.length} QR code${codes.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/qr-codes/new">
            <Plus className="size-4" />
            Create QR Code
          </Link>
        </Button>
      </div>

      {codes.length === 0 ? (
        <EmptyState
          icon={QrCodeIcon}
          title="No QR codes yet"
          description="Dynamic QR codes keep the same printed code while you change where it points — perfect for menus, posters, packaging and campaigns."
          action={
            <Button asChild>
              <Link href="/dashboard/qr-codes/new">
                <Plus className="size-4" />
                Create your first QR code
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block gap-0 py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Short link</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12 pr-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => {
                    const redirectUrl = redirectUrlFor(baseUrl, code.shortCode);
                    return (
                      <TableRow key={code.id}>
                        <TableCell className="pl-6 max-w-48">
                          <Link
                            href={`/dashboard/qr-codes/${code.id}`}
                            className="font-medium hover:underline"
                          >
                            {code.name}
                          </Link>
                          {code.description ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {code.description}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="max-w-40 truncate rounded bg-muted px-1.5 py-0.5 text-xs">
                              /r/{code.shortCode}
                            </code>
                            <CopyButton value={redirectUrl} />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-44">
                          <span className="block truncate text-sm text-muted-foreground">
                            {code.destinationUrl}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatNumber(code.scanCount)}
                        </TableCell>
                        <TableCell>
                          {code.isActive ? (
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
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(code.createdAt)}
                        </TableCell>
                        <TableCell className="pr-6">
                          <QrRowActions
                            qrCodeId={code.id}
                            name={code.name}
                            isActive={code.isActive}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {codes.map((code) => {
              const redirectUrl = redirectUrlFor(baseUrl, code.shortCode);
              return (
                <Card key={code.id} className="gap-0 py-0">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/dashboard/qr-codes/${code.id}`}
                        className="font-medium leading-snug hover:underline"
                      >
                        {code.name}
                      </Link>
                      {code.isActive ? (
                        <Badge variant="outline" className="shrink-0 gap-1.5 border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 gap-1.5 text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-zinc-400" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <code className="truncate rounded bg-muted px-1.5 py-0.5 text-xs">
                        /r/{code.shortCode}
                      </code>
                      <CopyButton value={redirectUrl} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      → {code.destinationUrl}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {formatNumber(code.scanCount)} scans · {timeAgo(code.createdAt)}
                      </span>
                      <Link
                        href={`/dashboard/qr-codes/${code.id}#analytics`}
                        className="flex items-center gap-1 font-medium text-foreground"
                      >
                        <BarChart3 className="size-3.5" />
                        Stats
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
