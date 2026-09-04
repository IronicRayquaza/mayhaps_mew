import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Routes that require a valid session
const PROTECTED = ["/dashboard", "/onboarding", "/settings"];
// Routes only accessible when NOT logged in
const AUTH_ONLY = ["/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this path needs protection
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some(p => pathname.startsWith(p));

  if (!isProtected && !isAuthOnly) return NextResponse.next();

  // Read the Supabase session from cookies using a custom cookie reader matching the browser's cookies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        storage: {
          getItem: (key) => {
            const cookie = request.cookies.get(key);
            if (!cookie) return null;
            return decodeURIComponent(cookie.value);
          },
          setItem: () => {},
          removeItem: () => {}
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // No session → redirect to auth
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Already logged in → redirect away from auth page
  if (isAuthOnly && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/settings/:path*", "/auth"]
};
