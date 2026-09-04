"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { listRuns, type Run } from "../../lib/api";
import styles from "../dashboard/dashboard.module.css";

/**
 * Run history.
 *
 * Runs are persisted server-side, so what the agent did survives a reload, a
 * restart, and a different device. Nothing here is reconstructed from the chat
 * transcript.
 */

const STATUS_LABEL: Record<Run["status"], string> = {
  queued: "QUEUED",
  running: "RUNNING",
  completed: "DONE",
  failed: "FAILED",
  cancelled: "CANCELLED",
  // A run that exhausted its budget is deliberately not shown as done.
  incomplete: "INCOMPLETE",
};

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    listRuns(50)
      .then(({ runs }) => setRuns(runs))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const statusClass = (status: Run["status"]) => {
    if (status === "completed") return styles["level-SUCCESS"];
    if (status === "failed" || status === "cancelled") return styles["level-ERROR"];
    if (status === "incomplete") return styles["level-WARN"];
    return styles["level-INFO"];
  };

  const duration = (run: Run) => {
    if (!run.finished_at) return "—";
    const ms = new Date(run.finished_at).getTime() - new Date(run.created_at).getTime();
    return ms < 1000 ? "<1s" : `${Math.round(ms / 1000)}s`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>ULLA_BRITTA</span>
          <span className={styles.headerDivider}>|</span>
          <span style={{ fontSize: "10px" }}>[RUN_HISTORY]</span>
        </div>
        <div className={styles.headerRight}>
          <span>[{runs?.length ?? 0} RECORDED]</span>
        </div>
      </header>

      <main className={`${styles.main} dither-bg`}>
        <section className={`${styles.logsWindow} animate-slide-down`} style={{ gridColumn: "1 / -1" }}>
          <div className={styles.windowHeader}>
            <span className={styles.windowTitle}>RUNS</span>
            <div className={styles.windowControls}>
              <span className={`${styles.controlBox} ${styles.controlBoxFilled}`} />
            </div>
          </div>

          <div className={styles.logsContent}>
            {error && (
              <div className={styles.logEntry}>
                <span className={`${styles.logLevel} ${styles["level-ERROR"]}`}>ERROR</span>
                <span className={styles.logMessage}>{error}</span>
              </div>
            )}

            {!error && runs === null && (
              <div className={styles.logEntry}>
                <span className={`${styles.logMessage} ${styles.emptyState}`}>Loading…</span>
              </div>
            )}

            {runs?.length === 0 && (
              <div className={styles.logEntry}>
                <span className={`${styles.logMessage} ${styles.emptyState}`}>
                  No runs yet. Anything you ask the agent to do will be recorded here.
                </span>
              </div>
            )}

            {runs?.map((run) => (
              <div key={run.id}>
                <div
                  className={`${styles.logEntry} animate-fade-in`}
                  onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                  style={{ cursor: "pointer" }}
                >
                  <span className={styles.logTime}>
                    {new Date(run.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className={`${styles.logLevel} ${statusClass(run.status)}`}>
                    {STATUS_LABEL[run.status] ?? run.status}
                  </span>
                  <div className={styles.entryBody}>
                    <span className={styles.logMessage}>{run.input}</span>
                    <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                      {duration(run)}
                      {run.stop_reason && run.stop_reason !== "completed"
                        ? ` · stopped: ${run.stop_reason}`
                        : ""}
                    </span>
                  </div>
                </div>

                {expanded === run.id && (
                  <div
                    className={styles.messageBubble}
                    style={{ margin: "0.25rem 0 1rem 1rem", maxWidth: "none" }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {run.result || (run.error ? `**Failed:** ${run.error}` : "_No output was recorded._")}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className={`${styles.bottomNav} animate-slide-up`}>
        <button className={`${styles.navButton} ${styles.navButtonActive}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            history
          </span>
          <span className={styles.navLabel}>RUNS</span>
        </button>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <button className={styles.navButton}>
            <span className="material-symbols-outlined">memory</span>
            <span className={styles.navLabel}>AGENT</span>
          </button>
        </Link>
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
