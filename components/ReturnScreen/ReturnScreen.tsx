'use client';

/**
 * "You were away" interstitial — shown on return after > 24 hours.
 *
 * Compares current stock prices (live from the API) against the player's
 * saved prices (state.stockPrices from localStorage) to show what changed.
 * One tap dismisses it and drops the player straight into the game.
 */
import { PRODUCTS } from '@/lib/game-engine';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { ProductId } from '@/types/game';
import styles from './ReturnScreen.module.css';

const PRODUCT_IDS: ProductId[] = ['lemonade', 'juice', 'cookies', 'tea', 'mystery'];

interface ReturnScreenProps {
  standName:     string;
  daysAway:      number;
  savedPrices:   Record<string, number>;   // state.stockPrices (from last session)
  currentPrices: Record<string, number>;   // live prices from useStockPrices
  onDismiss:     () => void;
}

function getDelta(current: number, saved: number): number {
  if (!saved || saved === 0) return 0;
  return (current - saved) / saved;
}

function fmtDelta(delta: number): string {
  const sign = delta >= 0 ? '▲' : '▼';
  return `${sign} ${Math.abs(delta * 100).toFixed(1)}%`;
}

export default function ReturnScreen({
  standName,
  daysAway,
  savedPrices,
  currentPrices,
  onDismiss,
}: ReturnScreenProps) {
  // Trap keyboard focus inside the overlay while it is visible
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  const rows = PRODUCT_IDS
    .map(id => {
      const def   = PRODUCTS[id];
      const saved = savedPrices[def.stockSymbol];
      const curr  = currentPrices[def.stockSymbol];
      if (!saved || !curr) return null;
      const delta = getDelta(curr, saved);
      return { id, def, delta };
    })
    .filter(Boolean) as Array<{ id: ProductId; def: typeof PRODUCTS[ProductId]; delta: number }>;

  // Pick the most dramatic mover for the headline
  const bigMover = rows.length > 0
    ? rows.reduce((best, r) => Math.abs(r.delta) > Math.abs(best.delta) ? r : best, rows[0])
    : null;

  const headline = bigMover
    ? Math.abs(bigMover.delta) < 0.01
      ? `Markets were quiet while you were away.`
      : bigMover.delta > 0
        ? `${bigMover.def.emoji} ${bigMover.def.label} ingredients got pricier — plan ahead!`
        : `${bigMover.def.emoji} ${bigMover.def.label} costs dropped — great time to sell more!`
    : `Welcome back! Check what changed.`;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="You were away"
      onClick={onDismiss}
    >
      <div className={styles.card} ref={trapRef} onClick={e => e.stopPropagation()}>

        <div className={styles.emoji} aria-hidden="true">📅</div>

        <h1 className={styles.heading}>
          {daysAway === 1
            ? `Welcome back, ${standName}!`
            : `You were away ${daysAway} days, ${standName}!`}
        </h1>

        <p className={styles.headline}>{headline}</p>

        {rows.length > 0 && (
          <div className={styles.table} role="table" aria-label="Stock changes while you were away">
            <div className={styles.tableHeader} role="row">
              <span role="columnheader">Product</span>
              <span role="columnheader">Stock</span>
              <span role="columnheader">Change</span>
            </div>
            {rows.map(({ id, def, delta }) => (
              <div key={id} className={styles.tableRow} role="row">
                <span role="cell">{def.emoji} {def.label}</span>
                <span role="cell" className={styles.symbol}>{def.stockSymbol}</span>
                <span
                  role="cell"
                  className={delta > 0.001 ? styles.up : delta < -0.001 ? styles.down : styles.flat}
                >
                  {fmtDelta(delta)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className={styles.tip}>
          💡 Remember: real stock moves are dampened by 70% in-game, so big swings
          won&apos;t ruin you — but they&apos;re worth watching!
        </p>

        <button className={styles.cta} onClick={onDismiss} autoFocus>
          Let&apos;s go! →
        </button>

        <p className={styles.disclaimer}>
          For educational entertainment only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
