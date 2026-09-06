"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "../../lib/supabase";
import {
  startRun,
  cancelRun,
  listRuns,
  getStatus,
  streamRun,
  type Run,
  type RunEvent,
} from "../../lib/api";
import styles from "./dashboard.module.css";

/**
 * The agent console.
 *
 * Everything on this screen comes from a real run. The previous version seeded the
 * log panel with invented lines ("Reticulating splines...", "Caffeine levels
 * sub-optimal"), ran a decorative uptime counter, and showed "thinking" steps from
 * an 800ms timer while the agent's real progress sat unread in the database. It
 * also inferred agent state by substring-matching the reply text.
 */

interface Message {
  role: "user" | "ulla";
  text: string;
  timestamp: string;
  status?: Run["status"];
}

interface TimelineEntry {
  id: string;
  kind: "thinking" | "narration" | "tool" | "result" | "provider" | "error" | "end";
  label: string;
  detail?: string;
  /** Concrete details proving the step happened. */
  evidence?: string[];
  ok?: boolean;
  /** Still in flight: a tool call with no result yet. */
  pending?: boolean;
  /** Links a result back to the call it completes. */
  callKey?: string;
  time: string;
}

const clock = () => new Date().toLocaleTimeString([], { hour12: false });
const shortTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Evidence list, collapsed past a few entries so a long run stays readable. */
function Evidence({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;

  const shown = expanded ? items : items.slice(0, 4);
  const hidden = items.length - shown.length;

  return (
    <div className={styles.evidence}>
      {shown.map((item, i) => (
        <span key={i} className={styles.evidenceItem}>
          {item}
        </span>
      ))}
      {hidden > 0 && (
        <button className={styles.evidenceToggle} onClick={() => setExpanded(true)}>
          show {hidden} more
        </button>
      )}
      {expanded && items.length > 4 && (
        <button className={styles.evidenceToggle} onClick={() => setExpanded(false)}>
          show less
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ steps: number; maxSteps: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [online, setOnline] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const closeStreamRef = useRef<(() => void) | null>(null);
  const runStartedAt = useRef<number | null>(null);

  const isRunning = activeRunId !== null;

  const addEntry = useCallback((entry: Omit<TimelineEntry, "id" | "time">) => {
    setTimeline((prev) => [
      ...prev.slice(-200),
      { ...entry, id: crypto.randomUUID(), time: clock() },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // Elapsed time for the active run only — not a decorative uptime clock.
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      if (runStartedAt.current) {
        setElapsed(Math.floor((Date.now() - runStartedAt.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Backend reachability.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        await getStatus();
        if (!cancelled) {
          setOnline(true);
          setConnectionError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setOnline(false);
          setConnectionError(e instanceof Error ? e.message : String(e));
        }
      }
    };
    poll();
    const timer = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Restore past runs, so a reload does not lose the conversation.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      try {
        const { runs } = await listRuns(15);
        setRunCount(runs.length);

        const restored: Message[] = [];
        for (const run of [...runs].reverse()) {
          restored.push({ role: "user", text: run.input, timestamp: shortTime() });
          if (run.result || run.error) {
            restored.push({
              role: "ulla",
              text: run.result || `The run failed: ${run.error}`,
              timestamp: shortTime(),
              status: run.status,
            });
          }
        }
        setMessages(restored);
      } catch {
        // No history is not an error worth putting in the user's face.
      }
    });
  }, []);

  useEffect(() => () => closeStreamRef.current?.(), []);

  const finishRun = useCallback(() => {
    closeStreamRef.current?.();
    closeStreamRef.current = null;
    setActiveRunId(null);
    setProgress(null);
    runStartedAt.current = null;
  }, []);

  const handleEvent = useCallback(
    (event: RunEvent) => {
      if (event.budget) {
        setProgress({ steps: event.budget.steps, maxSteps: event.budget.maxSteps });
      }

      switch (event.type) {
        case "thinking":
          addEntry({ kind: "thinking", label: "Thinking", detail: `step ${event.step ?? "?"}` });
          break;

        // The agent's own explanation of what it is about to do.
        case "narration":
          if (event.text) addEntry({ kind: "narration", label: event.text });
          break;

        case "tool_call":
          // Shown as in-flight and rewritten in place when its result arrives, so a
          // step does not appear twice.
          addEntry({
            kind: "tool",
            label: event.narration || event.name || "Working",
            pending: true,
            callKey: event.name,
          });
          break;

        case "tool_result": {
          const failed = event.ok === false;
          setTimeline((prev) => {
            const index = [...prev]
              .reverse()
              .findIndex((e) => e.pending && e.callKey === event.name);

            const resolved: TimelineEntry = {
              id: crypto.randomUUID(),
              kind: "result",
              // Plain-language summary from the backend; the tool name is the fallback.
              label: event.narration || event.name || "Done",
              evidence: event.evidence,
              ok: !failed,
              time: clock(),
            };

            if (index === -1) return [...prev.slice(-200), resolved];

            const at = prev.length - 1 - index;
            return [...prev.slice(0, at), { ...resolved, id: prev[at].id }, ...prev.slice(at + 1)];
          });
          break;
        }

        case "provider_switch":
          addEntry({
            kind: "provider",
            label: `Switched to ${event.provider}`,
            detail: "the primary model was unavailable",
          });
          break;

        case "error":
          addEntry({ kind: "error", label: "Error", detail: event.message });
          break;

        case "run_complete": {
          addEntry({
            kind: "end",
            label: `Run ${event.stopReason || "finished"}`,
            ok: event.ok,
          });
          setMessages((prev) => [
            ...prev,
            {
              role: "ulla",
              text: event.text || "The run finished without a reply.",
              timestamp: shortTime(),
              status: event.ok ? "completed" : (event.stopReason as Run["status"]) || "failed",
            },
          ]);
          finishRun();
          listRuns(15)
            .then(({ runs }) => setRunCount(runs.length))
            .catch(() => {});
          break;
        }
      }
    },
    [addEntry, finishRun]
  );

  const send = async () => {
    const text = input.trim();
    if (!text || isRunning) return;

    setInput("");
    setTimeline([]);
    setElapsed(0);
    setMessages((prev) => [...prev, { role: "user", text, timestamp: shortTime() }]);

    try {
      const { runId } = await startRun(text);
      setActiveRunId(runId);
      runStartedAt.current = Date.now();
      addEntry({ kind: "thinking", label: "Run queued", detail: runId.slice(0, 8) });

      closeStreamRef.current = await streamRun(runId, handleEvent, (message) => {
        addEntry({ kind: "error", label: "Stream lost", detail: message });
        finishRun();
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      addEntry({ kind: "error", label: "Could not start", detail });
      setMessages((prev) => [
        ...prev,
        {
          role: "ulla",
          text: `**Could not start the run:** ${detail}`,
          timestamp: shortTime(),
          status: "failed",
        },
      ]);
      finishRun();
    }
  };

  const stop = async () => {
    if (!activeRunId) return;
    try {
      const result = await cancelRun(activeRunId);
      addEntry({
        kind: "end",
        label: result.cancelled ? "Cancelling…" : "Could not cancel",
        detail: result.reason,
        ok: result.cancelled,
      });
    } catch (e) {
      addEntry({
        kind: "error",
        label: "Cancel failed",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const levelClass = (kind: TimelineEntry["kind"], ok?: boolean) => {
    if (kind === "error" || ok === false) return styles["level-ERROR"];
    if (kind === "result" && ok) return styles["level-SUCCESS"];
    if (kind === "provider") return styles["level-WARN"];
    if (kind === "thinking") return styles["level-PROCESS"];
    return styles["level-INFO"];
  };

  const levelLabel = (kind: TimelineEntry["kind"], ok?: boolean, pending?: boolean) => {
    if (pending) return "RUN";
    if (kind === "error" || ok === false) return "FAIL";
    if (kind === "result") return "DONE";
    if (kind === "provider") return "WARN";
    if (kind === "tool") return "CALL";
    if (kind === "end") return "END";
    return "INFO";
  };

  const statusClass = online === null ? styles.statusIdle : online ? styles.statusOk : styles.statusBad;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>ULLA_BRITTA</span>
          <span className={styles.headerDivider}>|</span>
          <span className={statusClass} style={{ fontSize: "10px" }} title={connectionError || undefined}>
            [BACKEND: {online === null ? "CHECKING" : online ? "REACHABLE" : "UNREACHABLE"}]
          </span>
        </div>
        <div className={styles.headerRight}>
          {isRunning ? (
            <>
              <span>[STEP {progress ? `${progress.steps}/${progress.maxSteps}` : "—"}]</span>
              <span>[{elapsed}s]</span>
            </>
          ) : (
            <span>
              [{runCount} RUN{runCount === 1 ? "" : "S"}]
            </span>
          )}
        </div>
      </header>

      <main className={`${styles.main} dither-bg`}>
        {/* Live run timeline. Every line is a real event emitted by the agent. */}
        <section className={`${styles.logsWindow} animate-slide-down`}>
          <div className={styles.windowHeader}>
            <span className={styles.windowTitle}>
              {isRunning ? "RUN_IN_PROGRESS" : "RUN_TIMELINE"}
            </span>
            <div className={styles.windowControls}>
              {isRunning && (
                <button className={styles.cancelButton} onClick={stop}>
                  CANCEL
                </button>
              )}
              <span className={`${styles.controlBox} ${styles.controlBoxFilled}`} />
            </div>
          </div>

          <div className={styles.logsContent}>
            {timeline.length === 0 && (
              <div className={styles.logEntry}>
                <span className={`${styles.logMessage} ${styles.emptyState}`}>
                  No run yet. Ask for something below and you will see each step as it
                  happens — what it is reading, what it found, and what it changed.
                </span>
              </div>
            )}

            {timeline.map((entry) =>
              // The agent speaking gets its own treatment: this is reasoning, not a
              // mechanical step, and it should read that way.
              entry.kind === "narration" ? (
                <div key={entry.id} className={`${styles.narration} animate-fade-in`}>
                  {entry.label}
                </div>
              ) : (
                <div
                  key={entry.id}
                  className={`${styles.logEntry} animate-fade-in ${
                    entry.pending ? styles.stepActive : ""
                  }`}
                >
                  <span className={styles.logTime}>{entry.time}</span>
                  <span className={`${styles.logLevel} ${levelClass(entry.kind, entry.ok)}`}>
                    {levelLabel(entry.kind, entry.ok, entry.pending)}
                  </span>
                  <div className={styles.entryBody}>
                    <span className={styles.logMessage}>{entry.label}</span>
                    {entry.detail && (
                      <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                        {entry.detail}
                      </span>
                    )}
                    {entry.evidence && entry.evidence.length > 0 && (
                      <Evidence items={entry.evidence} />
                    )}
                  </div>
                </div>
              )
            )}

            {isRunning && (
              <div className={styles.terminalPrompt}>
                <span className={styles.statusOk}>&gt;</span>
                <span className={`${styles.cursor} cursor-blink`} />
              </div>
            )}
            <div ref={timelineEndRef} />
          </div>
        </section>

        <section className={`${styles.chatWindow} dither-bg animate-slide-up`}>
          <div className={styles.windowHeader}>
            <span className={styles.windowTitle}>AGENT_CHAT : ULLA_BRITTA</span>
            <span className={statusClass}>[ {online ? "CONNECTED" : "DISCONNECTED"} ]</span>
          </div>

          <div className={styles.chatContent}>
            {messages.length === 0 && (
              <div className={`${styles.message} ${styles.messageAgent}`}>
                <div className={styles.messageBubble}>
                  {/*
                    These suggestions are the only signal most people get about
                    what the agent can reach. They listed repositories, pull
                    requests and dependencies long after the tool surface had
                    grown past that, so people asked for things they assumed were
                    impossible and never tried the rest. One per area it covers.
                  */}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {[
                      "I operate your GitHub account. Try:",
                      "",
                      "- `what repositories can you see?`",
                      "- `do I have any open pull requests anywhere?`",
                      "- `why did CI fail on owner/repo?` — I read the actual job log",
                      "- `open an issue on owner/repo about the stale cache`",
                      "- `what changed in the last release of owner/repo?`",
                      "- `how many followers do I have?`",
                      "",
                      "I can also write files, open and merge pull requests, cut releases,",
                      "trigger workflows and create repositories — I'll say before I do.",
                      "",
                      "I report what I actually did, including anything that failed.",
                    ].join("\n")}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.message} ${
                  msg.role === "ulla" ? styles.messageAgent : styles.messageUser
                } animate-fade-in`}
              >
                <span className={`${styles.messageMeta} ulla-glow`} suppressHydrationWarning>
                  [{msg.role === "ulla" ? "ULLA" : "USER"}] {msg.timestamp}
                  {msg.status && msg.status !== "completed" ? ` · ${msg.status}` : ""}
                </span>
                <div
                  className={`${styles.messageBubble} ${
                    msg.role === "user" ? styles.messageBubbleUser : ""
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className={styles.inputArea}>
            <span className={styles.windowTitle} style={{ fontSize: "1.5rem" }}>
              &gt;
            </span>
            <input
              className={styles.chatInput}
              type="text"
              placeholder={isRunning ? "A run is in progress…" : "What should I do on GitHub?"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={isRunning}
            />
            <button
              className={styles.transmitButton}
              onClick={isRunning ? stop : send}
              disabled={!isRunning && input.trim() === ""}
            >
              {isRunning ? "Cancel" : "Send"}
            </button>
          </div>
        </section>
      </main>

      <nav className={`${styles.bottomNav} animate-slide-up`}>
        <Link href="/runs" style={{ textDecoration: "none" }}>
          <button className={styles.navButton}>
            <span className="material-symbols-outlined">history</span>
            <span className={styles.navLabel}>RUNS</span>
          </button>
        </Link>
        <button className={`${styles.navButton} ${styles.navButtonActive}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            memory
          </span>
          <span className={styles.navLabel}>AGENT</span>
        </button>
        <Link href="/settings" style={{ textDecoration: "none" }}>
          <button className={styles.navButton}>
            <span className="material-symbols-outlined">settings</span>
            <span className={styles.navLabel}>SETTINGS</span>
          </button>
        </Link>
      </nav>
    </div>
  );
}
