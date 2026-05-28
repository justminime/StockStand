'use client';

import type { AgeTier } from '@/types/game';
import styles from './AgeGate.module.css';

interface AgeGateProps {
  onSelect: (tier: AgeTier) => void;
}

export default function AgeGate({ onSelect }: AgeGateProps) {
  function handleSelect(tier: AgeTier) {
    document.cookie = `pending_age_tier=${tier}; path=/; SameSite=Lax`;
    onSelect(tier);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>🍋 StockStand</h1>
        <h2 className={styles.heading}>How old are you?</h2>

        <div className={styles.buttons}>
          <button
            className={`${styles.btn} ${styles.btnKid}`}
            onClick={() => handleSelect('child')}
          >
            🧒 I&apos;m a kid (under 13)
          </button>
          <button
            className={`${styles.btn} ${styles.btnTeen}`}
            onClick={() => handleSelect('teen')}
          >
            🧑 I&apos;m a teen (13–17)
          </button>
          <button
            className={`${styles.btn} ${styles.btnAdult}`}
            onClick={() => handleSelect('adult')}
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
