import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "openqr_session";

/**
 * Lightweight edge middleware:
 *  - unauthenticated visitors hitting /dashboard/* are bounced to /login
 *  - authenticated visitors hitting /login or /register are sent to /dashboard
 *
 * The cookie-presence check here is only an optimisation; every server
 * component / action re-validates the session against the database.
 */
export function middleware(request: NextRequest) {
  // Only redirect navigations (GET/HEAD). Server Action POSTs must never be
  // answered with a raw redirect: the client router expects an RSC payload or
  // an `x-action-redirect` header, and a bare 3xx makes it throw
  // "An unexpected response was received from the server." Auth for POSTs is
  // enforced where it matters — requireUser() inside pages and actions.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const rawPathname = request.nextUrl.pathname;
  // Treat "/dashboard/" the same as "/dashboard" — some proxies normalize
  // paths to trailing-slash form and Next no longer redirects them back
  // (skipTrailingSlashRedirect). The `next` param keeps the original path.
  const pathname = rawPathname.length > 1 && rawPathname.endsWith("/")
    ? rawPathname.slice(0, -1)
    : rawPathname;
  const { search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isDashboard && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    const target = `${pathname}${search || ""}`;
    if (target && target !== "/") loginUrl.searchParams.set("next", target);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
