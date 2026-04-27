"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication delay
    router.push("/onboarding");
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
            <h1 className={styles.title}>DITHER_OS</h1>
            <div className={styles.subtitle}>{isLogin ? "SECURE ACCESS REQUIRED" : "OPERATOR ENROLLMENT"}</div>
            <div className={styles.divider}>× × × × × × × ×</div>
          </div>

          {/* Login Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Operator ID */}
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="operator_id">
                [INPUT_OPERATOR_ID]
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrompt}>&gt;</span>
                <input
                  id="operator_id"
                  className={styles.terminalInput}
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="operator_email">
                  [INPUT_OPERATOR_EMAIL]
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrompt}>&gt;</span>
                  <input
                    id="operator_email"
                    className={styles.terminalInput}
                    type="email"
                    required
                  />
                </div>
              </div>
            )}

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
                  required
                />
              </div>
            </div>

            {/* Action Button */}
            <button className={styles.submitButton} type="submit">
              <span className={styles.buttonText}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {isLogin ? "login" : "person_add"}
                </span>
                {isLogin ? "INITIATE_HANDSHAKE" : "REGISTER_IDENTITY"} <span className="cursor-blink">█</span>
              </span>
              <div className="absolute inset-0 dither-bg opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" />
            </button>
          </form>

          {/* Toggle Area */}
          <div className={styles.toggleArea}>
            <span>{isLogin ? "NEED ACCOUNT?" : "ALREADY REGISTERED?"}</span>
            <span className={styles.toggleLink} onClick={() => setIsLogin(!isLogin)}>
              [{isLogin ? "CREATE_NEW_OPERATOR" : "RETURN_TO_HANDSHAKE"}]
            </span>
          </div>

          {/* Footer Details */}
          <div className={styles.footer}>
            <span>SYS_TIME: 23:45:11</span>
            <span>NODE: 0x4F2A</span>
          </div>
        </div>
      </main>
    </div>
  );
}


