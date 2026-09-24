import { cn } from "@/lib/utils";

/**
 * OpenQR brand mark — QR finder patterns. Uses the same fixed palette as the
 * favicon (emerald square, white modules) so branding is consistent in the
 * navbar, auth pages and footer regardless of theme.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#059669" />
      {/* finder: top-left */}
      <rect x="10" y="10" width="16" height="16" rx="4" fill="#ffffff" />
      <rect x="13" y="13" width="10" height="10" rx="2" fill="#059669" />
      <rect x="15.5" y="15.5" width="5" height="5" rx="1" fill="#ffffff" />
      {/* finder: top-right */}
      <rect x="38" y="10" width="16" height="16" rx="4" fill="#ffffff" />
      <rect x="41" y="13" width="10" height="10" rx="2" fill="#059669" />
      <rect x="43.5" y="15.5" width="5" height="5" rx="1" fill="#ffffff" />
      {/* finder: bottom-left */}
      <rect x="10" y="38" width="16" height="16" rx="4" fill="#ffffff" />
      <rect x="13" y="41" width="10" height="10" rx="2" fill="#059669" />
      <rect x="15.5" y="43.5" width="5" height="5" rx="1" fill="#ffffff" />
      {/* data modules: bottom-right */}
      <rect x="38" y="38" width="7" height="7" rx="1.5" fill="#ffffff" />
      <rect x="47" y="38" width="7" height="7" rx="1.5" fill="#ffffff" opacity="0.7" />
      <rect x="38" y="47" width="7" height="7" rx="1.5" fill="#ffffff" opacity="0.7" />
      <rect x="47" y="47" width="7" height="7" rx="1.5" fill="#ffffff" />
    </svg>
  );
}
