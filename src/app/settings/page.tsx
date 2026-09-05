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

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ulla-britta.onrender.com";

interface Installation {
  installation_id: number;
  account_login: string;
  account_type: string;
  repositories_access: string;
  status: string;
  installed_at: string;
}

/**
 * Whether the agent may act as the person, rather than as the app.
 *
 * The installation token cannot create a repository on a personal account, star,
 * follow, read notifications or create a gist — GitHub refuses those to anything
 * that is not the user. `configured: false` means the server has no OAuth
 * credentials at all, which is a different thing from the user not having
 * connected, and the page says which.
 */
interface UserAuth {
  configured: boolean;
  connected: boolean;
  login: string | null;
}

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [accountEmail, setAccountEmail] = useState("");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [userAuth, setUserAuth] = useState<UserAuth | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  /** An authenticated call to the backend; the user id comes from the token. */
  const backend = async (path: string, init: RequestInit = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Your session has expired — sign in again.");

    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  };

  const refreshUserAuth = async () => {
    try {
      setUserAuth((await backend("/github/oauth/status")) as UserAuth);
    } catch {
      // The status endpoint is the only source of truth here, so an unreachable
      // backend shows nothing rather than a guess about what is connected.
      setUserAuth(null);
    }
  };

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

      // The OAuth callback returns here with its outcome in the query string. It
      // is read from the URL directly rather than through useSearchParams, which
      // would force this whole page into a Suspense boundary.
      const params = new URLSearchParams(window.location.search);
      const connected = params.get("github_user");
      const failed = params.get("github_error");
      if (connected) setNotice({ kind: "ok", text: `Connected as @${connected}.` });
      if (failed) setNotice({ kind: "bad", text: failed });
      if (connected || failed) {
        window.history.replaceState({}, "", window.location.pathname);
      }

      await refreshUserAuth();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const connectGithubUser = async () => {
    setConnecting(true);
    setNotice(null);
    try {
      const { url } = (await backend("/github/oauth/url")) as { url: string };
      window.location.href = url;
    } catch (e) {
      setNotice({ kind: "bad", text: e instanceof Error ? e.message : String(e) });
      setConnecting(false);
    }
  };

  const disconnectGithubUser = async () => {
    setConnecting(true);
    setNotice(null);
    try {
      await backend("/github/oauth/disconnect", { method: "POST" });
      await refreshUserAuth();
      setNotice({ kind: "ok", text: "Disconnected. The agent can no longer act as you." });
    } catch (e) {
      setNotice({ kind: "bad", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setConnecting(false);
    }
  };

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

        {/*
          Acting as the user. The app's own credentials cover repository work;
          GitHub refuses a handful of endpoints to anything that is not the person,
          so those actions need this and say so when they do not have it.
        */}
        {!loading && userAuth && (
          <section className={`${styles.logsWindow} animate-slide-down`}>
            <div className={styles.windowHeader}>
              <span className={styles.windowTitle}>ACT_AS_YOU</span>
              <div className={styles.windowControls}>
                <span
                  className={`${styles.controlBox} ${userAuth.connected ? styles.controlBoxFilled : ""}`}
                />
              </div>
            </div>

            <div className={styles.logsContent}>
              {userAuth.connected ? (
                <div className={styles.logEntry}>
                  <span className={`${styles.logLevel} ${styles["level-SUCCESS"]}`}>LINKED</span>
                  <div className={styles.entryBody}>
                    <span className={styles.logMessage}>
                      Authorized as @{userAuth.login}
                    </span>
                    <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                      The agent can create repositories on your personal account, star, follow,
                      read your notifications and create gists.
                    </span>
                    <button
                      className={styles.cancelButton}
                      onClick={disconnectGithubUser}
                      disabled={connecting}
                      style={{ alignSelf: "flex-start" }}
                    >
                      {connecting ? "Working…" : "DISCONNECT"}
                    </button>
                  </div>
                </div>
              ) : userAuth.configured ? (
                <div className={styles.logEntry}>
                  <span className={`${styles.logLevel} ${styles["level-WARN"]}`}>UNLINKED</span>
                  <div className={styles.entryBody}>
                    <span className={styles.logMessage}>Not authorized to act as you.</span>
                    <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                      GitHub will not let the app create a repository on your personal account,
                      star, follow, read notifications or create a gist on your behalf until you
                      authorize it. Everything else already works.
                    </span>
                    <button
                      className={styles.transmitButton}
                      onClick={connectGithubUser}
                      disabled={connecting}
                      style={{ alignSelf: "flex-start" }}
                    >
                      {connecting ? "Redirecting…" : "CONNECT GITHUB ACCOUNT"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.logEntry}>
                  <span className={`${styles.logLevel} ${styles["level-WARN"]}`}>OFF</span>
                  <div className={styles.entryBody}>
                    <span className={styles.logMessage}>
                      This server has no GitHub user authorization configured.
                    </span>
                    <span className={`${styles.logMessage} ${styles.entryDetail}`}>
                      Creating a repository on a personal account, starring, following,
                      notifications and gists are unavailable. Repository work is unaffected.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

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
