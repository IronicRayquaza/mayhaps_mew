import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* TopAppBar */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>DITHER_OS_v1.0</div>
        <div className={styles.navActions}>
          <button className={styles.iconButton}>
            <span className="material-symbols-outlined">memory</span>
          </button>
          <button className={styles.iconButton}>
            <span className="material-symbols-outlined">sensors</span>
          </button>
          <div className={styles.terminalButton}>
            <span className="material-symbols-outlined">terminal</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Background Grid Pattern */}
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6, pointerEvents: 'none' }} />

        {/* Central Initialization Window */}
        <div className={styles.window}>
          {/* Window Header */}
          <div className={styles.windowHeader}>
            <div className={styles.windowTitle}>
              [ SYSTEM_PROCESS: NEURAL_FLOW_INIT.EXE ]
            </div>
            <div className={styles.windowControls}>
              <div className={styles.controlBox} />
              <div className={styles.controlBox} />
              <div className={`${styles.controlBox} ${styles.controlBoxActive}`} />
            </div>
          </div>

          <div className={styles.windowContent}>
            {/* Dithered Accent */}
            <div className={`${styles.ditherAccent} dither-bg`} />

            {/* ASCII Art Logo */}
            <div className={styles.asciiContainer}>
              <pre className={styles.ascii}>
{`+=================================================+
|   ///      ///      ///      ///      ///       |
|  ///      ///      ///      ///      ///        |
| ///      ///      ///      ///      ///         |
+=================================================+
          |                              |         
          |      [ N E U R A L ]         |         
          |       [ F L O W ]            |         
          |                              |         
+=================================================+
| \\\\\\\\\\\\   \\\\\\\\\\\\   \\\\\\\\\\\\   \\\\\\\\\\\\   \\\\\\\\\\\\      |
|  \\\\\\\\\\\\   \\\\\\\\\\\\   \\\\\\\\\\\\   \\\\\\\\\\\\   \\\\\\\\\\\\     |
+=================================================+`}
              </pre>
            </div>

            {/* Boot Sequence Terminal */}
            <div className={styles.terminal}>
              <div className={styles.terminalLine}>&gt; KERNEL LOADED. VER: 9.4.1-STABLE</div>
              <div className={styles.terminalLine}>&gt; MOUNTING VFS... [OK]</div>
              <div className={styles.terminalLine}>&gt; INITIALIZING DITHER_OS DISPLAY PROTOCOLS... [OK]</div>
              <div className={styles.terminalLineActive}>&gt; ESTABLISHING SECURE CONNECTION TO NEURAL GRID...</div>
              <div className={styles.terminalLineActive}>&gt; ALLOCATING SYNAPTIC MEMORY BLOCKS... [0x7F8C4A]</div>
              <div className={styles.terminalLineActive}>
                &gt; SCANNING FOR EXTERNAL STIMULI...{" "}
                <span style={{ color: "var(--error)" }}>[WARNING: NONE DETECTED]</span>
              </div>
              <div className={styles.terminalLineActive}>&gt; BYPASSING SENSORY INPUT PROTOCOL... [OK]</div>
              <div className={`${styles.terminalLineActive}`} style={{marginTop: '0.5rem'}}>
                &gt; SYSTEM READY FOR MANUAL INITIALIZATION.
              </div>
              <div className={styles.terminalInputLine}>
                <span>root@neural-flow:~#</span>
                <div className={`${styles.cursor} cursor-blink`} />
              </div>
            </div>

            {/* Action Bar */}
            <div className={styles.actionBar}>
              <div className={styles.actionLabel}>[ ACTION REQUIRED ]</div>
              <div className={styles.buttonGroup}>
                <button className={styles.button}>
                  [ READ_DOCS ]
                </button>
                <Link href="/auth" style={{ textDecoration: 'none', display: 'contents' }}>
                  <button className={`${styles.button} ${styles.primaryButton}`}>
                    [ INITIALIZE_SYSTEM ]
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerStatus}>
          SYS_UPTIME: 00:42:11 // [STATUS: OPTIMAL]
        </div>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>LOG_OUT</a>
          <a href="#" className={styles.footerLink}>REBOOT</a>
          <a href="#" className={styles.footerLink}>SYS_HALT</a>
        </div>
      </footer>
    </div>
  );
}
