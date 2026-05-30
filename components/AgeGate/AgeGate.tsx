'use client';

import type { AgeTier } from '@/types/game';
import styles from './AgeGate.module.css';

interface AgeGateProps {
  onSelect: (tier: AgeTier) => void;
}

export default function AgeGate({ onSelect }: AgeGateProps) {
  // Age tier flows through React state only — never stored server-side in the
  // anonymous MVP (COPPA: no PII, no accounts for under-13).
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>🍋 StockStand</h1>
        <h2 className={styles.heading}>How old are you?</h2>

        <div className={styles.buttons}>
          <button
            className={`${styles.btn} ${styles.btnKid}`}
            onClick={() => onSelect('child')}
          >
            🧒 I&apos;m a kid (under 13)
          </button>
          <button
            className={`${styles.btn} ${styles.btnTeen}`}
            onClick={() => onSelect('teen')}
          >
            🧑 I&apos;m a teen (13–17)
          </button>
          <button
            className={`${styles.btn} ${styles.btnAdult}`}
            onClick={() => onSelect('adult')}
          >
            🧓 I&apos;m an adult (18+)
          </button>
        </div>

        <p className={styles.disclaimer}>
          StockStand is a game for educational purposes only. Stock prices shown are
          approximate and may be delayed. This is not financial advice.
        </p>
      </div>
    </div>
  );
}
