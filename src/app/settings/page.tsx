import styles from "./settings.module.css";

export default function SettingsPage() {
  return (
    <div className={styles.container}>
      {/* Top App Bar */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>DITHER_OS // SYS_ROOT</div>
        <div className={styles.headerIcons}>
          <button className={styles.headerIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>terminal</span>
          </button>
          <button className={styles.headerIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>settings_input_component</span>
          </button>
          <button className={styles.headerIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>power_settings_new</span>
          </button>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>[CMD_CENTER]</h2>
          <p className={styles.sidebarSubtitle}>VIRTUAL_STATION_01</p>
        </div>
        <div className={styles.navLinks}>
          <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hub</span>
            CHANNELS
          </a>
          <a href="#" className={styles.navLink}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
            ACCOUNT
          </a>
          <a href="#" className={styles.navLink}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_open</span>
            SECURITY
          </a>
          <a href="#" className={styles.navLink}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings_suggest</span>
            SYSTEM
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Window 1: Channel_Manager.exe */}
        <section className={styles.window} style={{ maxWidth: '600px' }}>
          <div className={`${styles.windowHeader} ${styles.accentDither}`}>
            <span className={styles.windowTitle}>[ CHANNEL_MANAGER.EXE ]</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', cursor: 'pointer' }}>close</span>
          </div>
          <div className={styles.windowContent}>
            <div className={styles.asciiArt}>
{`+--------------------------------------------------+
| STATUS: SCANNING INTEGRATIONS... OK.             |
+--------------------------------------------------+`}
            </div>

            {/* GitHub Integration */}
            <div className={styles.integrationCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIdentity}>
                  <div className={styles.asciiArt} style={{ fontSize: '10px', opacity: 1 }}>
{` /_/\ 
( o.o)
 > ^ <`}
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>[ GITHUB_REPO_SYNC ]</h3>
                    <p className={styles.cardSubtitle}>Last sync: 02:44:12 SYS_TIME</p>
                  </div>
                </div>
                <span className={`${styles.badge} ${styles.badgeAuthorized}`}>AUTHORIZED</span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardId}>ID: gh_8x92j_sys</span>
                <button className={styles.smallButton}>Revoke</button>
              </div>
            </div>

            {/* Slack Integration */}
            <div className={styles.integrationCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIdentity}>
                  <div className={styles.asciiArt} style={{ fontSize: '10px', opacity: 1 }}>
{`  #  # 
#######
  #  # `}
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>[ SLACK_WEBHOOK_01 ]</h3>
                    <p className={styles.cardSubtitle}>Channel: #sys-alerts</p>
                  </div>
                </div>
                <span className={`${styles.badge} ${styles.badgeIdle}`}>IDLE</span>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardId}>ID: slk_wh_001</span>
                <button className={styles.smallButton}>Revoke</button>
              </div>
            </div>
          </div>
        </section>

        {/* Window 2: Account_Prefs.sys */}
        <section className={styles.window} style={{ maxWidth: '500px' }}>
          <div className={`${styles.windowHeader} ${styles.accentDither}`}>
            <span className={styles.windowTitle}>[ ACCOUNT_PREFS.SYS ]</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', cursor: 'pointer' }}>close</span>
          </div>
          <div className={styles.windowContent}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>[ INPUT_USER_NAME ]</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrompt}>&gt;</span>
                <input className={styles.terminalInput} type="text" defaultValue="SYS_ADMIN_01" />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>[ API_KEY_PRIMARY ]</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrompt}>&gt;</span>
                <input className={styles.terminalInput} type="password" defaultValue="************************" />
              </div>
              <span className={styles.regenLink}>[ REGENERATE_KEY ]</span>
            </div>

            <div className={styles.asciiArt} style={{ opacity: 0.3 }}>
              --------------------------------------------------
            </div>

            <div className={styles.inputGroup} style={{ gap: '1rem' }}>
              <label className={styles.inputLabel}>[ NOTIFICATION_FLAGS ]</label>
              
              <div className={styles.flagRow}>
                <span>&gt; SYSTEM_ALERTS</span>
                <div className={`${styles.toggleContainer} ${styles.accentDither}`}>
                  <div className={`${styles.toggleInner} ${styles.toggleInnerRight}`} />
                </div>
              </div>

              <div className={styles.flagRow}>
                <span>&gt; LOGIN_NOTIFY</span>
                <div className={`${styles.toggleContainer} ${styles.accentDither}`}>
                  <div className={`${styles.toggleInner} ${styles.toggleInnerRight}`} />
                </div>
              </div>

              <div className={styles.flagRow} style={{ opacity: 0.5 }}>
                <span>&gt; VERBOSE_LOGGING</span>
                <div className={styles.toggleContainer}>
                  <div className={`${styles.toggleInner} ${styles.toggleInnerLeft}`} style={{ backgroundColor: 'var(--primary)' }} />
                </div>
              </div>
            </div>

            <button className={styles.saveButton}>
              <span className="material-symbols-outlined">save</span>
              SAVE_CONFIG
            </button>
          </div>
        </section>

        {/* Floating Terminal Indicator */}
        <div className={styles.floatingTerminal}>
          sys_root@dither_os:~$ <span className={`${styles.terminalCursor} cursor-blink`} />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className={styles.bottomNav}>
        <a href="#" className={styles.bottomLink}>
          <span className="material-symbols-outlined">grid_view</span>
          ROOT
        </a>
        <a href="#" className={`${styles.bottomLink} ${styles.bottomLinkActive}`}>
          <span className="material-symbols-outlined">lan</span>
          NET
        </a>
        <a href="#" className={styles.bottomLink}>
          <span className="material-symbols-outlined">folder</span>
          DISK
        </a>
        <a href="#" className={styles.bottomLink}>
          <span className="material-symbols-outlined">terminal</span>
          X-TERM
        </a>
        <a href="#" className={styles.bottomLink}>
          <span className="material-symbols-outlined">fingerprint</span>
          ID
        </a>
      </nav>
    </div>
  );
}
