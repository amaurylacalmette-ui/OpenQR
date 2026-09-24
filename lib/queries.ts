import "server-only";

import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateRange = "today" | "7d" | "30d" | "all";

export type RangeStats = {
  totalScans: number;
  uniqueScans: number;
};

export type SeriesPoint = { label: string; scans: number; uniques: number };

export type Breakdown = { label: string; count: number };

export type TopQr = {
  id: string;
  name: string;
  shortCode: string;
  isActive: boolean;
  scanCount: number;
};

export type RecentScan = {
  id: string;
  createdAt: Date;
  country: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  qrCode: { id: string; name: string; shortCode: string };
};

// ---------------------------------------------------------------------------
// Range helpers
// ---------------------------------------------------------------------------

export function rangeStart(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "all":
      return null;
  }
}

export function rangeLabel(range: DateRange): string {
  switch (range) {
    case "today":
      return "Today";
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "all":
      return "All time";
  }
}

// ---------------------------------------------------------------------------
// Core aggregates
// ---------------------------------------------------------------------------

export async function getRangeStats(
  where: { qrCodeId?: string; userId?: string },
  range: DateRange
): Promise<RangeStats> {
  const start = rangeStart(range);
  const scanWhere: {
    createdAt?: { gte?: Date };
    qrCodeId?: string;
    qrCode?: { userId?: string; isActive?: boolean };
  } = {};
  if (start) scanWhere.createdAt = { gte: start };
  if (where.qrCodeId) scanWhere.qrCodeId = where.qrCodeId;
  if (where.userId) scanWhere.qrCode = { userId: where.userId };

  const [totalScans, uniqueHashes] = await Promise.all([
    db.scanEvent.count({ where: scanWhere }),
    db.scanEvent.findMany({
      where: scanWhere,
      distinct: ["ipHash"],
      select: { ipHash: true },
    }),
  ]);

  return { totalScans, uniqueScans: uniqueHashes.length };
}

/** Builds a time series (per hour/day/month depending on range) from raw timestamps. */
export async function getSeries(
  where: { qrCodeId?: string; userId?: string },
  range: DateRange
): Promise<SeriesPoint[]> {
  const start = rangeStart(range);

  const scanWhere: {
    createdAt?: { gte?: Date };
    qrCodeId?: string;
    qrCode?: { userId?: string };
  } = {};
  if (start) scanWhere.createdAt = { gte: start };
  if (where.qrCodeId) scanWhere.qrCodeId = where.qrCodeId;
  if (where.userId) scanWhere.qrCode = { userId: where.userId };

  const events = await db.scanEvent.findMany({
    where: scanWhere,
    select: { createdAt: true, ipHash: true },
  });

  // Bucketing strategy per range
  const useHourly = range === "today";
  const useMonthly =
    range === "all" &&
    events.some(
      (e) => Date.now() - e.createdAt.getTime() > 60 * 24 * 3600 * 1000
    );

  const buckets = new Map<string, { scans: number; uniques: Set<string> }>();
  const order: string[] = [];

  function keyFor(d: Date): string {
    if (useHourly) {
      const h = d.getHours();
      return `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(h).padStart(2, "0")}`;
    }
    if (useMonthly) {
      return `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${String(d.getFullYear()).padStart(4, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Pre-populate empty buckets so charts show gaps, not missing labels
  if (start) {
    const cursor = new Date(start);
    const now = new Date();
    while (cursor <= now) {
      const key = keyFor(cursor);
      if (!buckets.has(key)) {
        buckets.set(key, { scans: 0, uniques: new Set() });
        order.push(key);
      }
      if (useHourly) cursor.setHours(cursor.getHours() + 1);
      else if (useMonthly) cursor.setMonth(cursor.getMonth() + 1);
      else cursor.setDate(cursor.getDate() + 1);
    }
  }

  for (const e of events) {
    const key = keyFor(e.createdAt);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { scans: 0, uniques: new Set() };
      buckets.set(key, bucket);
      order.push(key);
    }
    bucket.scans += 1;
    if (e.ipHash) bucket.uniques.add(e.ipHash);
  }

  order.sort();

  return order.map((key) => {
    const b = buckets.get(key)!;
    return {
      label: formatBucketLabel(key, useHourly, useMonthly),
      scans: b.scans,
      uniques: b.uniques.size,
    };
  });
}

function formatBucketLabel(key: string, hourly: boolean, monthly: boolean): string {
  if (hourly) {
    const h = Number(key.split("T")[1]);
    const suffix = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${suffix}`;
  }
  if (monthly) {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Breakdowns
// ---------------------------------------------------------------------------

async function breakdown(
  field: "country" | "deviceType" | "browser" | "os" | "referrer",
  where: { qrCodeId?: string; createdAt?: { gte?: Date } },
  limit = 5
): Promise<Breakdown[]> {
  const grouped = await db.scanEvent.groupBy({
    by: [field],
    where,
    _count: { _all: true },
    orderBy: { _count: { [field]: "desc" } },
    take: limit,
  });

  return grouped
    .filter((g) => g[field] !== null)
    .map((g) => ({
      label: (g[field] as string) ?? "Unknown",
      count: g._count._all,
    }));
}

export async function getBreakdowns(
  where: { qrCodeId?: string; createdAt?: { gte?: Date } }
) {
  const [countries, devices, browsers, oses, referrers] = await Promise.all([
    breakdown("country", where),
    breakdown("deviceType", where, 4),
    breakdown("browser", where),
    breakdown("os", where),
    breakdown("referrer", where, 5),
  ]);
  return { countries, devices, browsers, oses, referrers };
}

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

export async function getDashboardOverview(userId: string) {
  const sevenDaysAgo = rangeStart("7d")!;

  const [totalQrCodes, activeQrCodes, totalScans, scans7d] = await Promise.all([
    db.qRCode.count({ where: { userId } }),
    db.qRCode.count({ where: { userId, isActive: true } }),
    db.scanEvent.count({
      where: { qrCode: { userId } },
    }),
    db.scanEvent.count({
      where: { qrCode: { userId }, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  // Top codes by scan count
  const topCandidates = await db.qRCode.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      shortCode: true,
      isActive: true,
      _count: { select: { scanEvents: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const topQrCodes: TopQr[] = topCandidates
    .sort((a, b) => b._count.scanEvents - a._count.scanEvents)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      shortCode: c.shortCode,
      isActive: c.isActive,
      scanCount: c._count.scanEvents,
    }));

  const recentScansRaw = await db.scanEvent.findMany({
    where: { qrCode: { userId } },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      createdAt: true,
      country: true,
      deviceType: true,
      browser: true,
      os: true,
      referrer: true,
      qrCode: { select: { id: true, name: true, shortCode: true } },
    },
  });
  const recentScans: RecentScan[] = recentScansRaw;

  return {
    totalQrCodes,
    activeQrCodes,
    totalScans,
    scans7d,
    topQrCodes,
    recentScans,
  };
}

// ---------------------------------------------------------------------------
// QR list & detail
// ---------------------------------------------------------------------------

export async function getQrCodesForUser(userId: string) {
  const codes = await db.qRCode.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      shortCode: true,
      destinationUrl: true,
      isActive: true,
      foregroundColor: true,
      backgroundColor: true,
      errorCorrection: true,
      size: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { scanEvents: true } },
    },
  });
  return codes.map((c) => ({
    ...c,
    scanCount: c._count.scanEvents,
    _count: undefined,
  }));
}

export async function getQrCodeById(userId: string, id: string) {
  const code = await db.qRCode.findFirst({
    where: { id, userId },
    include: {
      _count: { select: { scanEvents: true } },
    },
  });
  if (!code) return null;
  return { ...code, scanCount: code._count.scanEvents, _count: undefined };
}
