import Link from "next/link";
import { cn } from "@/lib/utils";
import { rangeLabel, type DateRange } from "@/lib/queries";

const RANGES: DateRange[] = ["today", "7d", "30d", "all"];

export function RangeTabs({
  current,
  basePath,
  extraParams = {},
}: {
  current: DateRange;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  function hrefFor(range: DateRange) {
    const params = new URLSearchParams();
    params.set("range", range);
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v);
    }
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div
      className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5"
      role="tablist"
      aria-label="Date range"
    >
      {RANGES.map((r) => (
        <Link
          key={r}
          href={hrefFor(r)}
          role="tab"
          aria-selected={current === r}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm",
            current === r
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {rangeLabel(r)}
        </Link>
      ))}
    </div>
  );
}
