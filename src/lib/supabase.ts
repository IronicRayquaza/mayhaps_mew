import { createClient } from '@supabase/supabase-js';

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

// Singleton Supabase browser client — uses anon key only (safe for frontend)
// Service role key must NEVER be used in frontend code.
let client: ReturnType<typeof createClient<Database>> | null = null;

const customCookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const name = key + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    // Set cookie that is accessible to all paths
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; max-age=-99999999;`;
  }
};

export function getSupabase() {
  if (!client) {
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: customCookieStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }
  return client;
}

export const supabase = getSupabase();
