import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client.
 *
 * This previously used a hand-rolled cookie storage that wrote the whole session
 * into a single cookie. A real session here is about 5KB, and browsers silently
 * drop any cookie over 4096 bytes — so the session was never persisted. Signing in
 * appeared to work (the client keeps it in memory for that page load) and then every
 * protected route bounced straight back to /auth, because the server could not see
 * it.
 *
 * createBrowserClient splits the session across numbered chunks
 * (sb-<ref>-auth-token.0, .1, …) and reassembles them on read, matching what
 * createServerClient expects in the middleware. Both halves have to use this
 * package, or one writes a format the other cannot read.
 */

/**
 * Minimal schema shape for the tables the dashboard touches.
 *
 * Without a schema generic, supabase-js infers every row as `never`, which makes
 * `.select()` results and `.upsert()` payloads fail to typecheck. This describes
 * just enough for the app to compile honestly; replace it with generated types
 * (`supabase gen types typescript`) when the schema settles.
 */
type Row = Record<string, unknown>;
type Table = { Row: Row; Insert: Row; Update: Row; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table;
      user_preferences: Table;
      agent_logs: Table;
      github_installations: Table;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabase() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

export const supabase = getSupabase();
