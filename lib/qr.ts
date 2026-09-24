import "server-only";

import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Short codes — unambiguous base62 alphabet, 8 chars ≈ 2.2e14 combinations
// ---------------------------------------------------------------------------

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function generateShortCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

// ---------------------------------------------------------------------------
// Base URL resolution (env override → request headers)
// ---------------------------------------------------------------------------

/**
 * Resolves the public base URL of this OpenQR instance.
 * Priority: NEXT_PUBLIC_APP_URL → x-forwarded-proto/host headers → localhost.
 */
export async function getBaseUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function redirectUrlFor(baseUrl: string, shortCode: string): string {
  return `${baseUrl}/r/${shortCode}`;
}

// ---------------------------------------------------------------------------
// Scannability guard — a QR code is only useful if phones can read it
// ---------------------------------------------------------------------------

// Shared with the client-side customizer (re-exported for convenience).
export { luminance, isScannableColorPair } from "@/lib/qr-client";

// ---------------------------------------------------------------------------
// QR rendering (server-side)
// ---------------------------------------------------------------------------

export type QrRenderOptions = {
  foregroundColor?: string;
  backgroundColor?: string;
  /** Pixel width of the generated image. */
  width?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
};

const DEFAULTS: Required<Omit<QrRenderOptions, never>> = {
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
  width: 512,
  errorCorrectionLevel: "M",
};

/** Renders the QR code as a standalone SVG string. */
export async function renderQrSvg(
  data: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const opts = { ...DEFAULTS, ...options };
  return QRCode.toString(data, {
    type: "svg",
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: 4, // quiet zone — required by ISO/IEC 18004
    width: opts.width,
    color: {
      dark: opts.foregroundColor,
      light: opts.backgroundColor,
    },
  });
}

/** Renders the QR code as a PNG buffer. */
export async function renderQrPng(
  data: string,
  options: QrRenderOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULTS, ...options };
  return QRCode.toBuffer(data, {
    type: "png",
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: 4,
    width: opts.width,
    color: {
      dark: opts.foregroundColor,
      light: opts.backgroundColor,
    },
  });
}
