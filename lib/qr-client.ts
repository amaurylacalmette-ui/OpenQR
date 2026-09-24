/**
 * Client-safe QR helpers (no server-only imports) — shared by the live
 * customizer UI and the server-side renderer.
 */

/** Relative luminance (Rec. 601) of a #RRGGBB color, 0 (black) → 1 (white). */
export function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Validates a foreground/background pair for reliable scanning.
 * Rule: the foreground must be noticeably darker than the background.
 */
export function isScannableColorPair(foreground: string, background: string): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(foreground) || !/^#[0-9a-fA-F]{6}$/.test(background)) {
    return false;
  }
  try {
    return luminance(foreground) <= luminance(background) - 0.25;
  } catch {
    return false;
  }
}
