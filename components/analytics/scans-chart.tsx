"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/queries";

type ScanChartPayload = {
  label: string;
  scans: number;
  uniques: number;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ScanChartPayload }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-popover-foreground">
      <p className="text-xs font-medium text-muted-foreground">{d.label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">
        {d.scans} {d.scans === 1 ? "scan" : "scans"}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {d.uniques} unique
      </p>
    </div>
  );
}

export function ScansChart({
  data,
  height = 280,
}: {
  data: SeriesPoint[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="fillScans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillUniques" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#a1a1aa" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            allowDecimals={false}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#059669", strokeOpacity: 0.25 }} />
          <Area
            type="monotone"
            dataKey="uniques"
            stroke="#a1a1aa"
            strokeWidth={1.5}
            fill="url(#fillUniques)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="scans"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#fillScans)"
            dot={false}
            activeDot={{ r: 4, fill: "#059669" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-emerald-600" />
        Scans
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-zinc-400" />
        Unique scans
      </span>
    </div>
  );
}
