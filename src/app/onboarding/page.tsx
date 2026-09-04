"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./onboarding.module.css";

// GitHub App name on GitHub — update this to your app's slug
const GITHUB_APP_NAME = "ulla-britta-agent";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ulla-britta.onrender.com";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [githubLinked, setGithubLinked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([
    "> LOADING MODULES... [OK]",
    "> VERIFYING INTEGRITY... [OK]",
    "> WAITING FOR USER INPUT_"
  ]);

  const addLog = (msg: string) => setLog(prev => [...prev, `> ${msg}`]);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setEmail(data.user.email ?? "");
      }
    });
  }, []);

  // Handle GitHub App callback — installation_id comes back in URL
  useEffect(() => {
    const installId = searchParams.get("installation_id");
    const setupAction = searchParams.get("setup_action");

    if (installId && (setupAction === "install" || setupAction === "update")) {
      setInstallationId(installId);
      setGithubLinked(true);
      addLog(`GITHUB_APP_INSTALLED: installation_id=${installId} [OK]`);
      addLog("REPO_ACCESS_GRANTED [OK]");
      setStep(2);
    }
  }, [searchParams]);

  // Step 1: Redirect to GitHub App install
  const handleGitHubInstall = () => {
    addLog("REDIRECTING TO GITHUB_APP_INSTALL...");
    const callbackUrl = `${window.location.origin}/onboarding`;
    window.location.href = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new?state=${userId}`;
  };

  // Step 2: Save email preferences and complete onboarding
  const handleComplete = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    addLog("SAVING_PREFERENCES...");

    try {
      // 1. Save installation_id to backend (it will save to github_installations)
      if (installationId) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No active session — please sign in again.");

        // userId is derived from this token on the backend, not from the body.
        const linkRes = await fetch(`${BACKEND_URL}/github/link-installation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ installationId })
        });
        if (!linkRes.ok) {
          const body = await linkRes.json().catch(() => ({}));
          throw new Error(body.error || `Failed to link GitHub installation (${linkRes.status})`);
        }
        addLog("GITHUB_INSTALLATION_LINKED [OK]");
      }

      // 2. Save email in user_preferences.
      // These writes previously ignored their error, so a failure looked like
      // success and left onboarding half-finished — which is how a row-level
      // security misconfiguration turned into a silent login loop instead of a
      // visible "permission denied".
      const { error: prefError } = await supabase.from("user_preferences").upsert({
        user_id: userId,
        email,
        email_enabled: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      if (prefError) throw new Error(`Could not save your email: ${prefError.message}`);
      addLog("NOTIFICATION_EMAIL_SAVED [OK]");

      // 3. Mark onboarding complete
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: userId,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
      if (profileError) throw new Error(`Could not complete onboarding: ${profileError.message}`);
      addLog("ONBOARDING_COMPLETE [OK]");
      addLog("REDIRECTING TO DASHBOARD...");

      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Setup failed");
      addLog("ERROR: SETUP_FAILED");
    } finally {
      setSaving(false);
    }
  };

  const progress = step === 1 ? (githubLinked ? 60 : 25) : 90;

  return (
    <div className={styles.container}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }} />

      <main className={styles.wizardBox}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>terminal</span>
            <h1>SYS_SETUP_WIZARD.EXE</h1>
          </div>
          <div className={styles.headerControls}>
            <span className={`material-symbols-outlined ${styles.controlIcon}`}>minimize</span>
            <span className={`material-symbols-outlined ${styles.controlIcon}`}>check_box_outline_blank</span>
            <span className={`material-symbols-outlined ${styles.controlIcon}`}>close</span>
          </div>
        </header>

        <div className={styles.content}>
          {/* Progress */}
          <section className={styles.progressSection}>
            <div className={styles.progressLabelRow}>
              <span>[ INIT_SEQUENCE ]</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={`${styles.progressBarFill} dither-bg`} style={{ width: `${progress}%`, transition: 'width 0.5s ease' }} />
            </div>
            <div className={styles.progressLog}>
              {log.map((l, i) => (
                <span key={i}>{l}<br /></span>
              ))}
            </div>
          </section>

          <div className={styles.asciiLine} />

          {error && (
            <div style={{ color: 'var(--error)', fontFamily: 'monospace', fontSize: '11px', padding: '8px', border: '1px solid var(--error)', marginBottom: '12px' }}>
              ❌ {error}
            </div>
          )}

          {/* STEP 1 — GitHub App Install */}
          {step === 1 && (
            <section className={styles.stepSection}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepNumber}>01.</span> LINK_GITHUB_APP
              </h2>
              <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
                Install the Ulla Britta GitHub App on your account. This grants Ulla access to push files, 
                review PRs, and monitor your repositories. You can choose which repos to include.
              </p>

              {githubLinked ? (
                <div style={{ color: 'var(--success)', fontFamily: 'monospace', fontSize: '12px', padding: '10px', border: '1px solid var(--success)', background: 'rgba(0,255,0,0.05)' }}>
                  ✅ GITHUB_APP_INSTALLED — installation_id: {installationId}
                </div>
              ) : (
                <button
                  onClick={handleGitHubInstall}
                  style={{
                    width: '100%', padding: '12px', background: 'transparent',
                    border: '1px solid rgba(168,85,247,0.6)', color: 'var(--primary)',
                    fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  [ INSTALL_GITHUB_APP ]
                </button>
              )}

              {githubLinked && (
                <button
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%', marginTop: '12px', padding: '12px', background: 'rgba(168,85,247,0.15)',
                    border: '1px solid var(--primary)', color: 'var(--primary)',
                    fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  [ CONTINUE → STEP_02 ]
                </button>
              )}
            </section>
          )}

          {/* STEP 2 — Notification Email */}
          {step === 2 && (
            <section className={styles.stepSection}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepNumber}>02.</span> SET_NOTIFICATION_EMAIL
              </h2>
              <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
                This email receives commit summaries, CI/CD reports, and autonomous fix notifications from Ulla.
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontFamily: 'monospace', fontSize: '12px' }}>
                <span style={{ color: 'var(--primary)' }}>&gt;</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="operator@domain.com"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(168,85,247,0.4)',
                    color: 'var(--text)', fontFamily: 'monospace', fontSize: '12px', padding: '6px 4px', outline: 'none'
                  }}
                />
              </div>
            </section>
          )}

          <div className={styles.asciiLine} />

          {/* Actions */}
          <section className={styles.actions}>
            {step === 2 && (
              <button className={styles.abortButton} onClick={() => setStep(1)}>[ BACK ]</button>
            )}
            {step === 2 && (
              <button
                className={styles.nextButton}
                onClick={handleComplete}
                disabled={saving || !email}
              >
                {saving ? "[ PROCESSING... ]" : "[ ACTIVATE_ULLA ]"}
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
              </button>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--primary)', fontFamily: 'monospace', padding: '20px' }}>LOADING...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
