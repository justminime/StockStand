'use client';

import type { GameState, DisplayMode } from '@/types/game';
import styles from './StatsBar.module.css';

interface StatsBarProps {
  state: GameState;
  mode:  DisplayMode;
}

/** Axes-free P&L sparkline — Explorer mode only */
function PnlChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const W = 100, H = 28, PAD = 2;
  const min   = Math.min(...data, 0);
  const max   = Math.max(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const zeroY   = PAD + (1 - (0 - min) / range) * (H - PAD * 2);
  const lastVal = data[data.length - 1];

  return (
    <svg width={W} height={H} aria-hidden="true">
      {/* Zero baseline */}
      <line
        x1={PAD} y1={zeroY.toFixed(1)}
        x2={W - PAD} y2={zeroY.toFixed(1)}
        stroke="var(--border)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <polyline
        points={points}
        fill="none"
        stroke={lastVal >= 0 ? 'var(--green)' : 'var(--red)'}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StatsBar({ state, mode }: StatsBarProps) {
  const lastPnl  = state.pnlHistory.length > 0 ? state.pnlHistory[state.pnlHistory.length - 1] : null;
  const pnlClass = lastPnl !== null ? (lastPnl >= 0 ? styles.pnlGreen : styles.pnlRed) : '';
  const pnlSign  = lastPnl !== null && lastPnl >= 0 ? '+' : '';

  return (
    <footer className={styles.bar}>
      <div className={styles.stats}>
        {/* Balance */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>💰 Balance</span>
          <span className={styles.statValue}>${state.coins.toFixed(2)}</span>
        </div>

        {/* Round */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>🔄 Round</span>
          <span className={styles.statValue}>{state.round}</span>
        </div>

        {/* Last round P&L */}
        {lastPnl !== null && (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Last round</span>
            <span className={`${styles.statValue} ${pnlClass}`}>
              {pnlSign}${Math.abs(lastPnl).toFixed(2)}
            </span>
          </div>
        )}

        {/* Total earned */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total sales</span>
          <span className={styles.statValue}>{state.totalSales}</span>
        </div>

        {/* P&L trend chart (Explorer only) */}
        {mode === 'explorer' && state.pnlHistory.length >= 2 && (
          <div className={styles.chartWrap} aria-label="P&L trend">
            <PnlChart data={state.pnlHistory} />
          </div>
        )}
      </div>

      <p className={styles.disclaimer}>
        StockStand is for educational entertainment only. Prices are approximate and may be delayed.
        This is not financial advice.
      </p>
    </footer>
  );
}
