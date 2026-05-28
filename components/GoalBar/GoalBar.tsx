'use client';

import styles from './GoalBar.module.css';

interface GoalBarProps {
  coins:    number;
  goal?:    number;
}

const DEFAULT_GOAL = 100;

export default function GoalBar({ coins, goal = DEFAULT_GOAL }: GoalBarProps) {
  const clamped  = Math.min(coins, goal);
  const pct      = Math.round((clamped / goal) * 100);
  const reached  = coins >= goal;

  return (
    <div
      className={styles.wrap}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={clamped}
      aria-label={`Savings goal: ${pct}% of $${goal}`}
    >
      <div className={styles.labelRow}>
        <span className={styles.emoji} aria-hidden="true">
          {reached ? '🏆' : '🎯'}
        </span>
        <span className={styles.text}>
          {reached
            ? `Goal reached! $${coins.toFixed(2)} saved`
            : `$${coins.toFixed(2)} / $${goal} goal`}
        </span>
        <span className={styles.pct}>{pct}%</span>
      </div>

      <div className={styles.track}>
        <div
          className={`${styles.fill} ${reached ? styles.fillDone : pct >= 75 ? styles.fillNear : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
