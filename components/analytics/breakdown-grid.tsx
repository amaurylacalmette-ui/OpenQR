import { countryFlag, countryName, deviceLabel, formatNumber } from "@/lib/format";
import type { Breakdown } from "@/lib/queries";
import { Globe, Monitor, Chrome, Cpu, Link2 } from "lucide-react";
import type { ReactNode } from "react";

function Bar({ width }: { width: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-emerald-600/70 dark:bg-emerald-400/70"
        style={{ width: `${Math.max(4, Math.min(100, width))}%` }}
      />
    </div>
  );
}

function BreakdownList({
  title,
  icon: Icon,
  items,
  total,
  transform,
  leading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Breakdown[];
  total: number;
  transform?: (label: string) => string;
  leading?: (label: string) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No data in this period yet
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            const display = transform ? transform(item.label) : item.label;
            return (
              <li key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {leading ? <span className="leading-none">{leading(item.label)}</span> : null}
                    <span className="truncate">{display}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatNumber(item.count)} · {Math.round(pct)}%
                  </span>
                </div>
                <Bar width={pct} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function BreakdownGrid({
  countries,
  devices,
  browsers,
  oses,
  referrers,
  total,
}: {
  countries: Breakdown[];
  devices: Breakdown[];
  browsers: Breakdown[];
  oses: Breakdown[];
  referrers: Breakdown[];
  total: number;
}) {
  return (
    <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      <BreakdownList
        title="Top countries"
        icon={Globe}
        items={countries}
        total={total}
        transform={countryName}
        leading={(l) => countryFlag(l)}
      />
      <BreakdownList
        title="Devices"
        icon={Monitor}
        items={devices}
        total={total}
        transform={deviceLabel}
      />
      <BreakdownList title="Browsers" icon={Chrome} items={browsers} total={total} />
      <BreakdownList title="Operating systems" icon={Cpu} items={oses} total={total} />
      <BreakdownList
        title="Referrers"
        icon={Link2}
        items={referrers}
        total={total}
        transform={(l) => l.replace(/^https?:\/\//, "").replace(/\/$/, "") || "Direct"}
      />
    </div>
  );
}
