import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    // Only run Supabase if env vars exist
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value);
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      // Try to get user, but don't crash if it fails
      await supabase.auth.getUser().catch(() => {
        // Silently fail - user might not be logged in
      });
    }
  } catch (error) {
    console.error("[Proxy Error]", error);
    // Don't crash - just continue with the request
  }

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
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};