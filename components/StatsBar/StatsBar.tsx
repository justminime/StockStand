'use client';

import type { GameState, DisplayMode } from '@/types/game';
import styles from './StatsBar.module.css';

interface StatsBarProps {
  state: GameState;
  mode:  DisplayMode;
}

// ─── Full-width P&L area chart ────────────────────────────────────────────────

function PnlChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const W   = 600;  // viewBox units — scales with container
  const H   = 72;
  const PAD = { top: 8, right: 8, bottom: 22, left: 48 };
  const iW  = W - PAD.left - PAD.right;
  const iH  = H - PAD.top  - PAD.bottom;

  const min   = Math.min(...data, 0);
  const max   = Math.max(...data, 0);
  const range = max - min || 1;

  // Map a value to SVG y coordinate (inner area)
  const toY = (v: number) => PAD.top + (1 - (v - min) / range) * iH;
  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * iW;

  const zeroY   = toY(0);
  const lastVal = data[data.length - 1];
  const color   = lastVal >= 0 ? 'var(--green)' : 'var(--red)';
  const fillId  = lastVal >= 0 ? 'areaFillGreen' : 'areaFillRed';
  const fillColor = lastVal >= 0 ? '#2ECC71' : '#E74C3C';

  // Build polyline points string
  const pts = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  // Area path: line + drop down to zero + back
  const first = { x: toX(0), y: toY(data[0]) };
  const last  = { x: toX(data.length - 1), y: toY(data[data.length - 1]) };
  const areaPath =
    `M ${first.x.toFixed(1)},${first.y.toFixed(1)} ` +
    data.slice(1).map((v, i) => `L ${toX(i + 1).toFixed(1)},${toY(v).toFixed(1)}`).join(' ') +
    ` L ${last.x.toFixed(1)},${zeroY.toFixed(1)} L ${first.x.toFixed(1)},${zeroY.toFixed(1)} Z`;

  // X-axis round labels — show every other one if crowded
  const step  = data.length <= 6 ? 1 : Math.ceil(data.length / 6);
  const xLabels = data.map((_, i) => i).filter(i => i % step === 0 || i === data.length - 1);

  // Y-axis labels: min, 0, max
  const yLabels = [
    { v: max,  label: `$${max.toFixed(2)}` },
    { v: 0,    label: '$0' },
  ];
  if (min < 0) yLabels.push({ v: min, label: `$${min.toFixed(2)}` });

  return (
    <div className={styles.chartWrap} aria-label="P&amp;L trend chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={styles.chartSvg}
        role="img"
        aria-label="Profit and loss trend"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={fillColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${fillId})`} />

        {/* Zero baseline */}
        <line
          x1={PAD.left} y1={zeroY.toFixed(1)}
          x2={W - PAD.right} y2={zeroY.toFixed(1)}
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* P&L line */}
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Last-value dot */}
        <circle
          cx={last.x.toFixed(1)}
          cy={last.y.toFixed(1)}
          r="4"
          fill={color}
        />

        {/* Y-axis labels */}
        {yLabels.map(({ v, label }) => (
          <text
            key={label}
            x={PAD.left - 4}
            y={toY(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted)"
            fontFamily="var(--font-nunito), sans-serif"
          >
            {label}
          </text>
        ))}

        {/* X-axis round labels */}
        {xLabels.map(i => (
          <text
            key={i}
            x={toX(i).toFixed(1)}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            fill="var(--muted)"
            fontFamily="var(--font-nunito), sans-serif"
          >
            {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── StatsBar component ───────────────────────────────────────────────────────

export default function StatsBar({ state, mode }: StatsBarProps) {
  const lastPnl  = state.pnlHistory.length > 0 ? state.pnlHistory[state.pnlHistory.length - 1] : null;
  const pnlClass = lastPnl !== null ? (lastPnl >= 0 ? styles.pnlGreen : styles.pnlRed) : '';
  const pnlSign  = lastPnl !== null && lastPnl >= 0 ? '+' : '';

  // Total profit across all rounds
  const totalProfit = state.totalRevenue - state.totalCosts;

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
          <div className={`${styles.stat} ${styles.statHideMobile}`}>
            <span className={styles.statLabel}>Last round</span>
            <span className={`${styles.statValue} ${pnlClass}`}>
              {pnlSign}${Math.abs(lastPnl).toFixed(2)}
            </span>
          </div>
        )}

        {/* Total sales (hidden on mobile, shown in Explorer) */}
        {mode === 'explorer' && (
          <div className={`${styles.stat} ${styles.statHideMobile}`}>
            <span className={styles.statLabel}>Total sales</span>
            <span className={styles.statValue}>{state.totalSales}</span>
          </div>
        )}

        {/* Total profit — always shown */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            {mode === 'junior' ? '📦 Sales' : '📊 Net profit'}
          </span>
          <span className={`${styles.statValue} ${totalProfit >= 0 ? styles.pnlGreen : styles.pnlRed}`}>
            {mode === 'junior'
              ? state.totalSales
              : `${totalProfit >= 0 ? '+' : ''}$${Math.abs(totalProfit).toFixed(2)}`
            }
          </span>
        </div>

      </div>

      {/* Full-width P&L chart — Explorer mode only, needs ≥2 rounds */}
      {mode === 'explorer' && state.pnlHistory.length >= 2 && (
        <PnlChart data={state.pnlHistory} />
      )}

      <p className={styles.disclaimer}>
        StockStand is for educational entertainment only. Prices are approximate and may be delayed.
        This is not financial advice.
      </p>
    </footer>
  );
}
