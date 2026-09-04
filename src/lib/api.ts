import { supabase } from "./supabase";

/**
 * Backend client.
 *
 * Every call carries the signed-in user's Supabase token, and the backend derives
 * the user from it. The dashboard used to hardcode both the backend URL and a
 * single user id, so every signed-in person acted as the account owner.
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://ulla-britta.onrender.com";

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ApiError("Your session has expired. Sign in again.", 401);

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  const body = text ? safeParse(text) : {};

  if (!res.ok) {
    throw new ApiError(
      (body as { error?: string }).error || `Request failed (${res.status})`,
      res.status
    );
  }
  return body as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

// ── Types ───────────────────────────────────────────────────────────────────

export type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "incomplete";

export interface Run {
  id: string;
  status: RunStatus;
  input: string;
  result?: string | null;
  error?: string | null;
  stop_reason?: string | null;
  created_at: string;
  finished_at?: string | null;
}

/** One thing the agent did. Mirrors the backend event shape. */
export interface RunEvent {
  type:
    | "run_state"
    | "thinking"
    // The agent explaining, in its own words, what it is about to do.
    | "narration"
    | "tool_call"
    | "tool_result"
    | "provider_switch"
    | "error"
    | "run_end"
    | "run_complete";
  seq?: number;
  step?: number;
  name?: string;
  args?: Record<string, unknown>;
  /** Plain-language description of the step. */
  narration?: string;
  /** Concrete details proving the step happened: paths, names, counts, links. */
  evidence?: string[];
  /** Present on a `narration` event: the agent's own words. */
  text?: string;
  result?: {
    ok?: boolean;
    data?: Record<string, unknown>;
    error?: { code: string; message: string; retryable?: boolean; hint?: string };
  };
  ok?: boolean;
  message?: string;
  provider?: string;
  stopReason?: string;
  replayed?: boolean;
  budget?: { steps: number; maxSteps: number; tokens: number; elapsedMs: number };
  run?: { id: string; status: RunStatus; input: string };
}

// ── Runs ────────────────────────────────────────────────────────────────────

export const startRun = (message: string) =>
  request<{ runId: string; status: RunStatus }>("/api/runs", {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export const listRuns = (limit = 20) =>
  request<{ runs: Run[] }>(`/api/runs?limit=${limit}`);

export const getRun = (id: string) =>
  request<{ run: Run; steps: unknown[] }>(`/api/runs/${id}`);

export const cancelRun = (id: string) =>
  request<{ cancelled: boolean; reason?: string }>(`/api/runs/${id}/cancel`, {
    method: "POST",
  });

export const getStatus = () =>
  request<{ status: string; activeIntegrations: number; recentFixes: number }>(
    "/api/chat/status"
  );

/**
 * Opens the live event stream for a run.
 *
 * EventSource cannot set an Authorization header, so the token goes in the query
 * string; the backend verifies it exactly as it does a header token.
 */
export async function streamRun(
  runId: string,
  onEvent: (event: RunEvent) => void,
  onError?: (message: string) => void
): Promise<() => void> {
  const token = await getAccessToken();
  if (!token) throw new ApiError("Your session has expired. Sign in again.", 401);

  const source = new EventSource(
    `${BACKEND_URL}/api/runs/${runId}/stream?token=${encodeURIComponent(token)}`
  );

  source.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data) as RunEvent);
    } catch {
      // A malformed frame should not tear down the stream.
    }
  };

  source.onerror = () => {
    // EventSource reconnects on its own; only report once it has given up.
    if (source.readyState === EventSource.CLOSED) {
      onError?.("The connection to the run was lost.");
    }
  };

  return () => source.close();
}
