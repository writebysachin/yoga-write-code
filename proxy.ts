import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  try {
    const { pathname, hostname } = request.nextUrl;

    // Skip static files and Next.js internals
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth/callback")
    ) {
      return response;
    }

    const APP_HOST = "app.yogawritecode.com";
    const MARKETING_HOSTS = ["yogawritecode.com", "www.yogawritecode.com"];

    // App subdomain: redirect root to dashboard
    if (hostname === APP_HOST && pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Marketing domains: send auth/dashboard routes to the app subdomain
    if (MARKETING_HOSTS.includes(hostname)) {
      if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.hostname = APP_HOST;
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (error) {
    console.error("[Proxy Error]", error);
    // If anything fails, just let the request through
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};