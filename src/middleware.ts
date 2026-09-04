import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection.
 *
 * The previous version built a Supabase client around a storage shim that read one
 * cookie by its exact key. The session does not fit in one cookie — it is about 5KB
 * against a 4096 byte browser limit — so it is stored across numbered chunks
 * (…-auth-token.0, .1). Reading the un-suffixed key found nothing, getUser()
 * returned "Auth session missing!", and every protected route redirected to /auth.
 * That is what made signing in look like it did nothing.
 *
 * createServerClient understands the chunked format. It also refreshes an expired
 * token, which is why the cookies it sets have to be carried onto whatever response
 * we return — including a redirect, or the refreshed session is thrown away and the
 * next request has to refresh again.
 */

const PROTECTED = ["/dashboard", "/onboarding", "/settings"];
const AUTH_ONLY = ["/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));
  if (!isProtected && !isAuthOnly) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update the request so anything downstream in this pass sees the
          // refreshed session, then mirror onto the outgoing response.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the token with Supabase rather than trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /** Redirects while preserving any cookies the refresh above just set. */
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (isProtected && !user) return redirectTo("/auth");
  if (isAuthOnly && user) return redirectTo("/dashboard");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/settings/:path*", "/auth"],
};
