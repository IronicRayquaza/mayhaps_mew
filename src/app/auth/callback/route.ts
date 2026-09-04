import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * OAuth callback.
 *
 * This exchanged the code using a plain browser-style client, which had nowhere to
 * write the resulting session — so a GitHub sign-in produced a session that existed
 * only for the duration of this request and vanished before the redirect landed.
 * createServerClient writes it to the cookie jar in the chunked format the
 * middleware reads.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  // The provider can refuse before we ever see a code; say so rather than
  // reporting a generic failure.
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(oauthError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error?.message || "auth_failed")}`
    );
  }

  // No profile row yet is the normal state before onboarding completes;
  // .single() would turn that into a 406.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return NextResponse.redirect(
    `${origin}${profile?.onboarding_completed ? "/dashboard" : "/onboarding"}`
  );
}
