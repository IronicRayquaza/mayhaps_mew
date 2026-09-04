"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import styles from "./auth.module.css";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        // ── LOGIN ──────────────────────────────────────
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;

        // Check if onboarding is complete
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", data.user.id)
          .single();

        if (profile?.onboarding_completed) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } else {
        // ── SIGN UP ────────────────────────────────────
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` }
        });
        if (signUpErr) throw signUpErr;
        setSuccessMsg("ACCESS GRANTED. Check your email to verify your account, then return here to log in.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AUTH_FAILED: Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setError(error.message);
  };

  return (
    <div className={styles.container}>
      {/* Background Grid Pattern */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.3, pointerEvents: 'none' }} />

      <main className={styles.mainBox}>
        {/* Header Bar */}
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>terminal</span>
            <span>[{isLogin ? "AUTH_PROTOCOL_v2.0" : "NEW_OPERATOR_v1.0"}]</span>
          </div>
          <div className={styles.headerControls}>
            <div className={styles.controlBox} />
            <div className={styles.controlBox} />
            <div className={`${styles.controlBox} ${styles.controlBoxActive}`} />
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.content}>
          <div className={styles.decorativeBinary}>
            01001101<br />
            10110010<br />
            00101111
          </div>
          <div className={styles.decorativeError}>
            ERR_RATE: 0.00%
          </div>

          {/* ASCII Art Seal */}
          <div className={styles.asciiSeal} aria-hidden="true">
{`       .==.        
      ()''()-.     
   .-()''()  '-.   
  /   ....     \\  
 |   |    |     | 
 |   |    |     | 
 |   |____|     | 
 |  /_____\\    | 
 |  |     |    | 
  \\ \\_____/   /  
   '-.____.-'    `}
          </div>

          <div className={styles.titleArea}>
            <h1 className={styles.title}>ULLA_BRITTA</h1>
            <div className={styles.subtitle}>{isLogin ? "SECURE ACCESS REQUIRED" : "OPERATOR ENROLLMENT"}</div>
            <div className={styles.divider}>× × × × × × × ×</div>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div style={{ color: 'var(--error)', fontFamily: 'monospace', fontSize: '11px', marginBottom: '12px', padding: '8px', border: '1px solid var(--error)', background: 'rgba(255,0,0,0.05)' }}>
              ❌ {error}
            </div>
          )}
          {successMsg && (
            <div style={{ color: 'var(--success)', fontFamily: 'monospace', fontSize: '11px', marginBottom: '12px', padding: '8px', border: '1px solid var(--success)', background: 'rgba(0,255,0,0.05)' }}>
              ✅ {successMsg}
            </div>
          )}

          {/* Login Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Operator Email */}
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="operator_id">
                [INPUT_OPERATOR_EMAIL]
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrompt}>&gt;</span>
                <input
                  id="operator_id"
                  className={styles.terminalInput}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  required
                />
              </div>
            </div>

            {/* Access Key */}
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="access_key">
                [INPUT_ACCESS_KEY]
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrompt}>&gt;</span>
                <input
                  id="access_key"
                  className={styles.terminalInput}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Action Button */}
            <button className={styles.submitButton} type="submit" disabled={loading}>
              <span className={styles.buttonText}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {isLogin ? "login" : "person_add"}
                </span>
                {loading ? "PROCESSING..." : (isLogin ? "INITIATE_HANDSHAKE" : "REGISTER_IDENTITY")} <span className="cursor-blink">█</span>
              </span>
            </button>
          </form>

          {/* GitHub OAuth */}
          <div style={{ margin: '12px 0', textAlign: 'center', fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-muted)' }}>── OR ──</div>
          <button
            onClick={handleGitHubLogin}
            style={{
              width: '100%', padding: '10px', background: 'transparent',
              border: '1px solid rgba(168,85,247,0.4)', color: 'var(--primary)',
              fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            [LOGIN_WITH_GITHUB]
          </button>

          {/* Toggle Area */}
          <div className={styles.toggleArea}>
            <span>{isLogin ? "NEED ACCOUNT?" : "ALREADY REGISTERED?"}</span>
            <span className={styles.toggleLink} onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}>
              [{isLogin ? "CREATE_NEW_OPERATOR" : "RETURN_TO_HANDSHAKE"}]
            </span>
          </div>

          {/* Footer Details */}
          <div className={styles.footer}>
            <span suppressHydrationWarning>SYS_TIME: {new Date().toLocaleTimeString([], { hour12: false })}</span>
            <span>NODE: 0x4F2A</span>
          </div>
        </div>
      </main>
    </div>
  );
}
