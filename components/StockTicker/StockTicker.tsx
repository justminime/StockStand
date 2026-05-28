'use client';

import type { DisplayMode } from '@/types/game';
import styles from './StockTicker.module.css';

interface StockTickerProps {
  prices:     Record<string, number>;
  prevPrices: Record<string, number>;
  mode:       DisplayMode;
}

const SYMBOLS = ['AAPL', 'TSLA', 'MCD', 'KO', 'GME'] as const;

const SYMBOL_EMOJI: Record<string, string> = {
  AAPL: '🧃',
  TSLA: '🍵',
  MCD:  '🍪',
  KO:   '🍋',
  GME:  '⭐',
};

function getDelta(current: number, prev: number): number {
  if (!prev || prev === 0) return 0;
  return (current - prev) / prev;
}

export default function StockTicker({ prices, prevPrices, mode }: StockTickerProps) {
  const items = SYMBOLS.map((symbol) => {
    const price = prices[symbol] ?? 0;
    const prev  = prevPrices[symbol] ?? price;
    const delta = getDelta(price, prev);
    return { symbol, price, delta };
  });

  // Duplicate for seamless loop
  const allItems = [...items, ...items];

  return (
    <div className={styles.strip} aria-label="Stock ticker">
      <div className={styles.track} role="marquee" aria-live="off">
        {allItems.map((item, idx) => {
          const pctText = `${item.delta >= 0 ? '▲' : '▼'} ${Math.abs(item.delta * 100).toFixed(1)}%`;
          const changeClass =
            item.delta > 0
              ? styles.changeUp
              : item.delta < 0
              ? styles.changeDown
              : styles.changeMuted;

          return (
            <span key={idx} className={styles.item}>
              {mode === 'junior' ? (
                <>
                  <span className={styles.emoji} aria-hidden="true">
                    {SYMBOL_EMOJI[item.symbol] ?? '💲'}
                  </span>
                  <span className={styles.price}>${item.price.toFixed(2)}</span>
                </>
              ) : (
                <>
                  <span className={styles.symbol}>{item.symbol}</span>
                  <span className={styles.price}>${item.price.toFixed(2)}</span>
                  <span className={`${styles.change} ${changeClass}`}>{pctText}</span>
                </>
              )}
              <span className={styles.dot} aria-hidden="true">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
