import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getServerEnv } from "@/server/env";

const PROTECTED_PREFIXES = ["/app", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Runs before every page request:
 * 1. refreshes the Supabase session cookie (Supabase's recommended SSR pattern);
 * 2. sends signed-out visitors away from private pages, and signed-in users away
 *    from the log-in and sign-up pages.
 *
 * This is a convenience redirect only. Every page, server action and route
 * handler verifies the user again, and row-level security enforces ownership.
 */
export async function proxy(request: NextRequest) {
  const env = getServerEnv();
  let response = NextResponse.next({ request });
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return response;

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Do not add code between client creation and getClaims (Supabase guidance).
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    // Keep any refreshed session cookies on the redirect response.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!signedIn && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return redirectTo(`/login?next=${encodeURIComponent(pathname + search)}`);
  }
  if (signedIn && AUTH_PAGES.includes(pathname)) {
    return redirectTo("/app");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/health|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
