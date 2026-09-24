"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

type QrPreviewProps = {
  data: string;
  foregroundColor?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  /** Rendered pixel width of the preview image (CSS pixels). */
  pixelSize?: number;
  className?: string;
};

type RenderResult = { src?: string; error?: string };

/**
 * Live QR preview rendered client-side. Purely visual — exports and the
 * stored QR are generated server-side from the same parameters.
 */
export function QrPreview({
  data,
  foregroundColor = "#000000",
  backgroundColor = "#FFFFFF",
  errorCorrectionLevel = "M",
  pixelSize = 200,
  className,
}: QrPreviewProps) {
  const [result, setResult] = useState<RenderResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(data, {
      errorCorrectionLevel,
      margin: 4,
      width: pixelSize * 2, // 2x for crisp rendering on high-DPI screens
      color: { dark: foregroundColor, light: backgroundColor },
    })
      .then((url) => {
        if (!cancelled) setResult({ src: url });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({
            error: "Could not render this QR code — the data may be too long.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data, foregroundColor, backgroundColor, errorCorrectionLevel, pixelSize]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl border bg-white dark:bg-white",
        className
      )}
      style={{ width: pixelSize, height: pixelSize }}
      role="img"
      aria-label="QR code preview"
    >
      {result?.error ? (
        <p className="px-4 text-center text-xs text-red-600">{result.error}</p>
      ) : result?.src ? (
        <img
          src={result.src}
          alt="QR code preview"
          width={pixelSize}
          height={pixelSize}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-500" />
          <span className="text-xs">Generating…</span>
        </div>
      )}
    </div>
  );
}
