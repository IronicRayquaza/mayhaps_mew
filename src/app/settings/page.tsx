"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "../dashboard/dashboard.module.css";

/**
 * Settings.
 *
 * This page was previously a static mock: a hardcoded "SYS_ADMIN_01" username, a
 * Slack integration that did not exist, invented connection IDs, and Revoke
 * buttons wired to nothing. Everything here now reads and writes real rows, and
 * anything not yet built is absent rather than mocked.
 */

interface Installation {
  installation_id: number;
  account_login: string;
  account_type: string;
  repositories_access: string;
  status: string;
  installed_at: string;
}

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [accountEmail, setAccountEmail] = useState("");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth");
        return;
      }
      setAccountEmail(data.user.email ?? "");

      const [prefs, installs] = await Promise.all([
        supabase
          .from("user_preferences")
          .select("email, email_enabled")
          .eq("user_id", data.user.id)
          .maybeSingle(),
        supabase
          .from("github_installations")
          .select("installation_id, account_login, account_type, repositories_access, status, installed_at")
          .eq("user_id", data.user.id),
      ]);

      const pref = prefs.data as { email?: string; email_enabled?: boolean } | null;
      setEmail(pref?.email ?? data.user.email ?? "");
      setEmailEnabled(pref?.email_enabled !== false);
      setInstallations((installs.data as unknown as Installation[]) ?? []);
      setLoading(false);
    })();
  }, [router]);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Your session has expired.");

      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: data.user.id,
          email,
          email_enabled: emailEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw new Error(error.message);

      setNotice({ kind: "ok", text: "Saved. Reports will go to this address." });
    } catch (e) {
      setNotice({ kind: "bad", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>ULLA_BRITTA</span>
          <span className={styles.headerDivider}>|</span>
          <span style={{ fontSize: "10px" }}>[SETTINGS]</span>
        </div>
        <div className={styles.headerRight}>
          <span>{accountEmail}</span>
        </div>
      </header>

      <main className={`${styles.main} dither-bg`}>
        <section className={`${styles.logsWindow} animate-slide-down`}>
          <div className={styles.windowHeader}>
            <span className={styles.windowTitle}>GITHUB_ACCESS</span>
            <div className={styles.windowControls}>
              <span className={`${styles.controlBox} ${styles.controlBoxFilled}`} />
            </div>
          </div>

          <div className={styles.logsContent}>
            {loading && (
              <div className={styles.logEntry}>
                <span className={`${styles.logMessage} ${styles.emptyState}`}>Loading…</span>
              </div>
            )}

            {!loading && installations.length === 0 && (
              <div className={styles.logEntry}>
                <div className={styles.entryBody}>
                  <span className={styles.logMessage}>No GitHub account connected.</span>
                  <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                    The agent cannot reach any repository until you install the GitHub App.
                  </span>
                  <Link href="/onboarding" className={styles.statusOk} style={{ fontSize: "11px" }}>
                    Connect GitHub →
                  </Link>
                </div>
              </div>
            )}

            {installations.map((install) => (
              <div key={install.installation_id} className={styles.logEntry}>
                <span
                  className={`${styles.logLevel} ${
                    install.status === "active" ? styles["level-SUCCESS"] : styles["level-WARN"]
                  }`}
                >
                  {install.status === "active" ? "ACTIVE" : install.status.toUpperCase()}
                </span>
                <div className={styles.entryBody}>
                  <span className={styles.logMessage}>
                    {install.account_login} ({install.account_type})
                  </span>
                  <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                    {install.repositories_access === "all"
                      ? "all repositories"
                      : "selected repositories"}
                    {" · installation "}
                    {install.installation_id}
                  </span>
                </div>
              </div>
            ))}

            {!loading && installations.length > 0 && (
              <div className={styles.logEntry}>
                <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                  Access is managed on GitHub. Change or remove it at{" "}
                  <a
                    href="https://github.com/settings/installations"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.statusOk}
                  >
                    github.com/settings/installations
                  </a>
                  .
                </span>
              </div>
            )}
          </div>
        </section>

        <section className={`${styles.chatWindow} dither-bg animate-slide-up`}>
          <div className={styles.windowHeader}>
            <span className={styles.windowTitle}>NOTIFICATIONS</span>
          </div>

          <div className={styles.chatContent}>
            <div className={styles.entryBody} style={{ gap: "1rem", padding: "0.5rem" }}>
              <label className={styles.messageMeta} htmlFor="report-email">
                Where reports are sent
              </label>
              <input
                id="report-email"
                className={styles.chatInput}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: "100%" }}
              />

              <label className={styles.messageMeta} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                />
                Send me email reports
              </label>

              {notice && (
                <span className={notice.kind === "ok" ? styles.statusOk : styles.statusBad}>
                  {notice.text}
                </span>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className={styles.transmitButton} onClick={save} disabled={saving || loading}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button className={styles.cancelButton} onClick={signOut}>
                  SIGN OUT
                </button>
              </div>
            </div>
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
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <button className={styles.navButton}>
            <span className="material-symbols-outlined">memory</span>
            <span className={styles.navLabel}>AGENT</span>
          </button>
        </Link>
        <button className={`${styles.navButton} ${styles.navButtonActive}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            settings
          </span>
          <span className={styles.navLabel}>SETTINGS</span>
        </button>
      </nav>
    </div>
  );
}
