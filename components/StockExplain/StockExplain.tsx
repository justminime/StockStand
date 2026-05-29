'use client';

import { getStockExplanation } from '@/lib/stock-explanations';
import type { AgeTier } from '@/types/game';
import styles from './StockExplain.module.css';

interface StockExplainProps {
  symbol:      string;
  delta:       number;
  productName: string;
  costMult:    number;
  ageTier:     AgeTier | null;
  showSymbol:  boolean;
  /** Controlled open state — lifted to ProductCard */
  open:        boolean;
}

/** Trigger button — renders inside the card header's stock row */
export function StockExplainButton({
  open,
  onToggle,
}: {
  open:     boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`${styles.triggerBtn} ${open ? styles.triggerBtnActive : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Hide stock explanation' : 'Explain this stock'}
    >
      <span aria-hidden="true">{open ? '▲' : 'ℹ️'}</span>
      {open ? 'Hide' : 'Explain'}
    </button>
  );
}

/** Slide-down panel — renders as a full-width sibling inside the card's flex column */
export function StockExplainPanel({
  symbol,
  delta,
  productName,
  costMult,
  ageTier,
  showSymbol,
  open,
}: StockExplainProps) {
  const expl = getStockExplanation({ symbol, delta, productName, costMult, ageTier });
  const tier = ageTier ?? 'child';
  const realWorldLabel = tier === 'child' ? '🌍 What\'s happening?' : '🌍 Real world';
  const gameLabel      = tier === 'child' ? '🎮 In your game'       : '🎮 Game impact';

  return (
    <div
      className={`${styles.panelWrap} ${open ? styles.panelWrapOpen : ''}`}
      aria-hidden={!open}
    >
      <div className={styles.panel}>

        {/* Company identity */}
        <div className={styles.section}>
          <div className={styles.companyRow}>
            <span className={styles.companyName}>
              {showSymbol ? expl.companyName : productName}
            </span>
            <span className={styles.dirBadge} aria-hidden="true">
              {expl.directionEmoji}
              {showSymbol && ` ${symbol}`}
            </span>
          </div>
          <p className={styles.companyBlurb}>{expl.companyBlurb}</p>
        </div>

        {/* Real-world */}
        <div className={`${styles.section} ${styles.sectionRealWorld}`}>
          <div className={styles.sectionHeader}>{realWorldLabel}</div>
          <p className={styles.sectionBody}>{expl.realWorld}</p>
        </div>

        {/* Game impact */}
        <div className={`${styles.section} ${styles.sectionGame}`}>
          <div className={styles.sectionHeader}>{gameLabel}</div>
          <p className={styles.sectionBody}>{expl.gameImpact}</p>
        </div>

        {/* Tip */}
        <div className={styles.tipBox} role="note">
          <span className={styles.tipIcon} aria-hidden="true">💡</span>
          <span>{expl.tip}</span>
        </div>

      </div>
    </div>
  );
}
