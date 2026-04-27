import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  return (
    <div className={styles.container}>
      {/* Background Grid Pattern */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }} />

      <main className={styles.wizardBox}>
        {/* Window Header */}
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
          {/* Progress Section */}
          <section className={styles.progressSection}>
            <div className={styles.progressLabelRow}>
              <span>[ INIT_SEQUENCE ]</span>
              <span>50%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={`${styles.progressBarFill} dither-bg`} />
            </div>
            <div className={styles.progressLog}>
              &gt; LOADING MODULES... [OK]
              <br />&gt; VERIFYING INTEGRITY... [OK]
              <br />&gt; WAITING FOR USER INPUT_
            </div>
          </section>

          <div className={styles.asciiLine} />

          {/* Step 01 */}
          <section className={styles.stepSection}>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>01.</span> LINK_GITHUB_REPO
            </h2>
            <div className={styles.inputFieldContainer}>
              <span className={styles.inputFieldLabel}>[ INPUT_REPO_URL ]</span>
              <div className={styles.terminalInputRow}>
                <span>&gt;</span>
                <input
                  className={styles.terminalInput}
                  type="text"
                  placeholder="https://github.com/user/repo"
                  defaultValue="https://github.com/dither-os/core-system"
                />
                <span className="cursor-blink" style={{ width: '8px', height: '1.2em', backgroundColor: 'var(--primary)', marginLeft: '4px' }} />
              </div>
            </div>
          </section>

          <div className={styles.asciiLine} />

          {/* Step 02 */}
          <section className={styles.stepSection}>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepNumber}>02.</span> SELECT_COMMS_PROTOCOL
            </h2>
            <div className={styles.protocolGrid}>
              {/* Option 1: Slack */}
              <label className={styles.protocolOption}>
                <input className={styles.radioInput} name="comms_protocol" type="radio" value="slack" />
                <div className={styles.protocolInfo}>
                  <span className={styles.protocolName}>[ PROTOCOL_SLACK ]</span>
                  <span className={styles.protocolDesc}>
                    ESTABLISH SECURE CONNECTION VIA SLACK API. REQUIRES BOT TOKEN.
                  </span>
                </div>
              </label>

              {/* Option 2: Discord */}
              <label className={styles.protocolOption}>
                <input className={styles.radioInput} name="comms_protocol" type="radio" value="discord" defaultChecked />
                <div className={styles.protocolInfo}>
                  <span className={styles.protocolName}>[ PROTOCOL_DISCORD ]</span>
                  <span className={styles.protocolDesc}>
                    CONNECT TO DISCORD GATEWAY. SUPPORTS HIGH-FREQUENCY DATA STREAMS.
                  </span>
                </div>
              </label>
            </div>
          </section>

          <div className={styles.asciiLine} />

          {/* Actions */}
          <section className={styles.actions}>
            <button className={styles.abortButton}>[ ABORT ]</button>
            <button className={styles.nextButton}>
              [ EXECUTE_NEXT ]
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
