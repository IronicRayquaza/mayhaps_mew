import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * TEMPORARY diagnostic — delete once the login loop is fixed.
 *
 * The middleware decides whether you are signed in by reading the session out of a
 * cookie server-side. If it cannot, every protected route bounces to /auth and the
 * login page looks like it is doing nothing. This page runs the SAME read the
 * middleware does and reports what it sees, so we can tell a client-side problem
 * from a server-side one instead of guessing.
 *
 * It prints cookie NAMES and lengths only — never their values, which contain your
 * access token.
 */

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const jar = await cookies();
  const all = jar.getAll();

  const supabaseCookies = all.filter((c) => c.name.startsWith("sb-"));

  // Exactly what middleware.ts does: build a client whose storage reads cookies.
  let resolvedUser: string | null = null;
  let authError: string | null = null;
  let storageKeyRead: string | null = null;

  try {
    // Mirrors middleware.ts exactly, so this page reports what it actually sees.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            storageKeyRead = "getAll() — chunk-aware";
            return jar.getAll();
          },
          setAll() {
            // A page cannot set cookies; a refresh here is simply not persisted.
          },
        },
      }
    );

    const { data, error } = await supabase.auth.getUser();
    resolvedUser = data.user?.id ?? null;
    authError = error?.message ?? null;
  } catch (e) {
    authError = e instanceof Error ? e.message : String(e);
  }

  const row = { padding: "4px 10px", borderBottom: "1px solid #333" };

  return (
    <div style={{ fontFamily: "monospace", fontSize: 13, padding: 24, color: "#e5e2e1", background: "#131313", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 16, marginBottom: 4 }}>Session diagnostic</h1>
      <p style={{ opacity: 0.6, marginBottom: 20 }}>
        Temporary page. Cookie names and sizes only — no values are shown.
      </p>

      <h2 style={{ fontSize: 14, marginTop: 20 }}>1. What the server can see</h2>
      <div style={{ border: "1px solid #333", marginTop: 8 }}>
        <div style={row}>
          <b>storage key requested:</b> {storageKeyRead ?? "(getItem was never called)"}
        </div>
        <div style={row}>
          <b>supabase cookies found:</b>{" "}
          {supabaseCookies.length === 0
            ? "NONE — the browser never stored a session cookie the server can read"
            : supabaseCookies.map((c) => `${c.name} (${c.value.length} bytes)`).join(", ")}
        </div>
        <div style={row}>
          <b>all cookie names:</b> {all.length ? all.map((c) => c.name).join(", ") : "(none)"}
        </div>
      </div>

      <h2 style={{ fontSize: 14, marginTop: 24 }}>2. Result of the middleware&apos;s check</h2>
      <div style={{ border: "1px solid #333", marginTop: 8 }}>
        <div style={row}>
          <b>user resolved:</b>{" "}
          <span style={{ color: resolvedUser ? "#4ade80" : "#ffb4ab" }}>
            {resolvedUser ? `yes — ${resolvedUser}` : "no"}
          </span>
        </div>
        <div style={row}>
          <b>auth error:</b> {authError ?? "(none)"}
        </div>
      </div>

      <h2 style={{ fontSize: 14, marginTop: 24 }}>3. What this means</h2>
      <div style={{ border: "1px solid #333", marginTop: 8, lineHeight: 1.7 }}>
        <div style={row}>
          <b>user resolved = yes</b> → the server can see your session. The login loop is
          somewhere else, not the cookie.
        </div>
        <div style={row}>
          <b>no supabase cookies at all</b> → the browser never wrote the session cookie, or
          wrote it in a way the server cannot read. The client stores the session in memory,
          which is why signing in appears to work and then every protected page bounces.
        </div>
        <div style={row}>
          <b>cookies present but user = no</b> → the cookie is there but unreadable in this
          form: wrong key, or mangled by the encode/decode round trip.
        </div>
      </div>
    </div>
  );
}
