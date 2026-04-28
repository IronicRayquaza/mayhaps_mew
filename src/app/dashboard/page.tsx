"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const [uptime, setUptime] = useState("04:20:11");

  // Simple uptime simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const parts = uptime.split(":").map(Number);
      let [h, m, s] = parts;
      s++;
      if (s >= 60) { m++; s = 0; }
      if (m >= 60) { h++; m = 0; }
      setUptime(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [uptime]);

  return (
    <div className={styles.container}>
      {/* Top App Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>DITHER_OS</span>
        </div>
        <div className={styles.headerRight}>
          <span>[STATUS: ACTIVE]</span>
          <span>[UPTIME: {uptime}]</span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className={`${styles.main} dither-bg`}>
        {/* SYSTEM_LOGS Window */}
        <section className={styles.logsWindow}>
          <div className={styles.windowHeader}>
            <span className={styles.windowTitle}>SYSTEM_LOGS</span>
            <div className={styles.windowControls}>
              <span className={`${styles.controlBox} ${styles.controlBoxFilled}`} />
              <span className={`${styles.controlBox} ${styles.controlBoxOutline}`} />
            </div>
          </div>
          <div className={styles.logsContent}>
            <p>INIT_SEQUENCE_START...</p>
            <p className={styles.logDim}>Loading modules: [████████░░░░] 66%</p>
            <p>Establishing secure connection to NODE_ALPHA</p>
            <p className={styles.logError}>ERR: Handshake failed. Retrying (1/3)</p>
            <p>Connection established. Latency: 42ms</p>
            <p className={styles.logDim}>----------------</p>
            <p>Incoming data stream detected on port 8080</p>
            <p>Parsing packet headers...</p>
            <p>Header: {'{ type: \'AUTH\', id: \'usr_892x\' }'}</p>
            <p className={styles.logSuccess}>AUTH_SUCCESS</p>
            <p>Mounting virtual drive: /mnt/data/v_drive_01</p>
            <p className={styles.logDim}>Scanning for anomalies...</p>
            <p>No anomalies detected. System stable.</p>
            <p>Awaiting input...</p>
            <div className={styles.terminalPrompt}>
              <span className={styles.logSuccess}>&gt;</span>
              <span className={`${styles.cursor} cursor-blink`} />
            </div>
          </div>
        </section>

        {/* AGENT_CHAT Window */}
        <section className={styles.chatWindow}>
          <div className={styles.windowHeader}>
            <span className={styles.windowTitle}>AGENT_CHAT : CYPHER</span>
            <span className={styles.logSuccess}>[ CONNECTED ]</span>
          </div>
          <div className={styles.chatContent}>
            {/* Agent Message */}
            <div className={`${styles.message} ${styles.messageAgent}`}>
              <span className={styles.messageMeta}>[CYPHER] 14:02:45</span>
              <div className={styles.messageBubble}>
                <p>Transmission received. I have analyzed the encrypted files from Sector 7. The structural integrity is compromised, but I managed to extract the core algorithms.</p>
              </div>
            </div>

            {/* User Message */}
            <div className={`${styles.message} ${styles.messageUser}`}>
              <span className={styles.messageMeta}>[USER] 14:05:12</span>
              <div className={`${styles.messageBubble} ${styles.messageBubbleUser}`}>
                <p>Excellent. Can you initiate a compilation sequence on the secondary cluster? We need to verify if the logic holds under load.</p>
              </div>
            </div>

            {/* Agent Message */}
            <div className={`${styles.message} ${styles.messageAgent}`}>
              <span className={styles.messageMeta}>[CYPHER] 14:06:01</span>
              <div className={styles.messageBubble}>
                <p>Initiating now. Allocating 45% of processing power to Cluster B.</p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--outline)' }}>
                  <p>PROCESS_ID: 9942A</p>
                  <p>STATUS: COMPILING [████░░░░░░░░] 30%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <span className={styles.windowTitle} style={{ fontSize: '1.5rem' }}>&gt;</span>
            <input 
              className={styles.chatInput} 
              type="text" 
              placeholder="[INPUT_COMMAND]"
            />
            <button className={styles.transmitButton}>
              Transmit
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <button className={styles.navButton}>
          <span className="material-symbols-outlined">terminal</span>
          <span className={styles.navLabel}>TERMINAL</span>
        </button>
        <button className={`${styles.navButton} ${styles.navButtonActive}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
          <span className={styles.navLabel}>AGENTS</span>
        </button>
        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <button className={styles.navButton}>
            <span className="material-symbols-outlined">settings</span>
            <span className={styles.navLabel}>SETTINGS</span>
          </button>
        </Link>
      </nav>
    </div>
  );
}
