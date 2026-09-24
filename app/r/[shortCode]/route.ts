import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildScanContext } from "@/lib/scan-tracking";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type Params = Promise<{ shortCode: string }>;

/**
 * The dynamic redirect endpoint: /r/{shortCode}
 *
 * 1. Looks up the QR code by its unique short code
 * 2. Records a privacy-friendly scan event
 * 3. 302-redirects the visitor to the *current* destination URL
 *
 * A 302 (temporary) redirect is essential: 301s get cached aggressively by
 * clients and proxies, which would break the "change destination anytime"
 * promise. The short code is permanent; the destination is not.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlPage(title: string, message: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(title)} · OpenQR</title>
<style>
  :root { color-scheme: light dark; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #fafafa; color: #18181b; padding: 24px;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #0f0f10; color: #f4f4f5; }
    .card { border-color: #2a2a2e !important; }
    .muted { color: #a1a1aa !important; }
  }
  .card {
    max-width: 420px; width: 100%; text-align: center;
    border: 1px solid #e4e4e7; border-radius: 16px; padding: 40px 32px;
    background: #fff;
  }
  .mark { width: 56px; height: 56px; margin: 0 auto 20px; border-radius: 12px; background: #059669;
    display: flex; align-items: center; justify-content: center; }
  .mark svg { width: 32px; height: 32px; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
  p { font-size: 14px; line-height: 1.6; }
  .muted { color: #71717a; margin-top: 6px; }
  .brand { margin-top: 24px; font-size: 12px; color: #a1a1aa; }
</style>
</head>
<body>
  <div class="card">
    <div class="mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="14" fill="none"/><rect x="8" y="8" width="20" height="20" rx="4" fill="#fff"/><rect x="36" y="8" width="20" height="20" rx="4" fill="#fff"/><rect x="8" y="36" width="20" height="20" rx="4" fill="#fff"/><rect x="38" y="38" width="6" height="6" rx="1.5" fill="#fff"/><rect x="48" y="48" width="8" height="8" rx="1.5" fill="#fff"/></svg>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p class="muted">${escapeHtml(message)}</p>
    <p class="brand">Powered by OpenQR</p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  });
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { shortCode: rawShortCode } = await params;
  // Defensive: proxies occasionally hand us trailing slashes.
  const shortCode = rawShortCode.replace(/\/+$/, "");

  // Basic hygiene — short codes are base62, anything else can't exist.
  if (!shortCode || shortCode.length > 32 || !/^[0-9A-Za-z]+$/.test(shortCode)) {
    return htmlPage(
      "Invalid QR code",
      "This QR code link does not look valid. Double-check the URL and try again."
    );
  }

  const qr = await db.qRCode.findUnique({
    where: { shortCode },
    select: { id: true, destinationUrl: true, isActive: true },
  });

  if (!qr) {
    return htmlPage(
      "QR code not found",
      "This QR code does not exist or has been deleted by its owner."
    );
  }

  if (!qr.isActive) {
    return htmlPage(
      "QR code paused",
      "The owner of this QR code has temporarily disabled it. Please try again later."
    );
  }

  // Analytics are best-effort: never block a redirect on them. Rate limiting
  // protects the analytics from flooding while keeping the redirect working.
  const headers = new Headers(_request.headers);
  const scanContext = buildScanContext(headers, _request.url);
  const limited = !rateLimit(
    `r:${scanContext.ipHash ?? "anon"}:${qr.id}`,
    RATE_LIMITS.redirectPerIp.limit,
    RATE_LIMITS.redirectPerIp.windowMs
  ).allowed;

  if (!limited) {
    try {
      await db.scanEvent.create({
        data: {
          qrCodeId: qr.id,
          country: scanContext.country,
          deviceType: scanContext.deviceType,
          browser: scanContext.browser,
          os: scanContext.os,
          referrer: scanContext.referrer,
          ipHash: scanContext.ipHash,
        },
      });
    } catch {
      // Analytics must never break the redirect.
    }
  }

  return NextResponse.redirect(qr.destinationUrl, {
    status: 302,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}
