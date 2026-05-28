'use client';

import { useMemo } from 'react';
import { PRODUCTS, calculateDemand } from '@/lib/game-engine';
import type { ProductId, ProductState, DisplayMode } from '@/types/game';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  productId:     ProductId;
  product:       ProductState;
  costMult:      number;    // global cost multiplier from events/cards
  demandMult:    number;    // global demand multiplier
  stockDelta:    number;    // % change in linked stock (0.05 = +5%)
  priceHistory:  number[];  // last N stock price points (for Explorer sparkline)
  mode:          DisplayMode;
  onPriceChange: (productId: ProductId, price: number) => void;
}

// ─── Sparkline (Explorer mode) ───────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const W = 120, H = 32, PAD = 2;
  const min   = Math.min(...data);
  const max   = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const trending = data[data.length - 1] >= data[0];
  return (
    <svg width={W} height={H} aria-hidden="true" style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={trending ? 'var(--green)' : 'var(--red)'}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductCard({
  productId,
  product,
  costMult,
  demandMult,
  stockDelta,
  priceHistory,
  mode,
  onPriceChange,
}: ProductCardProps) {
  const def           = PRODUCTS[productId];
  const effectiveCost = product.cost * costMult;
  const isProfitable  = product.price > effectiveCost;
  const margin        = isProfitable
    ? ((product.price - effectiveCost) / product.price) * 100
    : 0;

  const predictedSales = useMemo(
    () => calculateDemand(effectiveCost, product.price, demandMult, stockDelta),
    [effectiveCost, product.price, demandMult, stockDelta],
  );

  // Price slider bounds
  const priceMin  = Math.max(effectiveCost, 0.10);
  const priceMax  = Math.max(effectiveCost * 5, priceMin + 1.00);
  const priceStep = 0.05;

  // Stock delta badge (Explorer only)
  const deltaPct  = (Math.abs(stockDelta) * 100).toFixed(1);
  const pillClass = stockDelta > 0 ? styles.pillUp : stockDelta < 0 ? styles.pillDown : styles.pillNeutral;
  const pillText  = stockDelta > 0 ? `▲ ${deltaPct}%` : stockDelta < 0 ? `▼ ${deltaPct}%` : '─ 0%';

  // Cost direction arrow (was cost impacted by events?)
  const costArrow      = costMult > 1.01 ? '↑' : costMult < 0.99 ? '↓' : '';
  const costArrowClass = costMult > 1.01 ? styles.arrowUp : styles.arrowDown;

  // Margin bar fill
  const marginFillClass = margin >= 40 ? styles.marginGreen : margin >= 20 ? styles.marginYellow : styles.marginRed;

  // Demand indicator
  const demandLevel    = predictedSales >= 10 ? 2 : predictedSales >= 5 ? 1 : 0;
  const FACES          = ['😕', '😐', '😊'] as const;
  const demandTxtClass = demandLevel === 2 ? styles.demandTextGood : demandLevel === 1 ? styles.demandTextOk : styles.demandTextSlow;

  // Junior mode: coin emoji shorthand ($0.25 = 🪙)
  function coinDisplay(amount: number) {
    const count = Math.min(Math.max(1, Math.round(amount / 0.25)), 8);
    return '🪙'.repeat(count);
  }

  return (
    <article
      className={`${styles.card} ${isProfitable ? styles.cardWell : styles.cardHurting}`}
      aria-label={`${def.label} product card`}
    >
      {/* ── Header ─────────────────────────────── */}
      <div className={styles.header}>
        <span className={styles.productEmoji} aria-hidden="true">{def.emoji}</span>
        <div className={styles.headerInfo}>
          <h3 className={styles.productName}>{def.label}</h3>
          {mode === 'explorer' && (
            <div className={styles.stockRow}>
              <span className={styles.stockSymbol}>{def.stockSymbol}</span>
              <span className={`${styles.changePill} ${pillClass}`}>{pillText}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Sparkline (Explorer only) ───────────── */}
      {mode === 'explorer' && priceHistory.length >= 2 && (
        <Sparkline data={priceHistory} />
      )}

      {/* ── Cost row ────────────────────────────── */}
      <div className={styles.dataRow}>
        <span className={styles.dataLabel}>Ingredient cost</span>
        <span className={styles.dataValue}>
          {mode === 'explorer' ? `$${effectiveCost.toFixed(2)}` : coinDisplay(effectiveCost)}
          {costArrow && (
            <span className={`${styles.costArrow} ${costArrowClass}`} aria-hidden="true">
              {costArrow}
            </span>
          )}
        </span>
      </div>

      {/* ── Price slider ─────────────────────────── */}
      <div className={styles.sliderWrap}>
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Your price</span>
          <span className={styles.dataValue}>
            {mode === 'explorer' ? `$${product.price.toFixed(2)}` : coinDisplay(product.price)}
          </span>
        </div>
        <input
          type="range"
          className={styles.slider}
          min={priceMin}
          max={priceMax}
          step={priceStep}
          value={product.price}
          onChange={e => onPriceChange(productId, parseFloat(e.target.value))}
          aria-label={`${def.label} selling price`}
        />
      </div>

      {/* ── Margin bar (Explorer only) ───────────── */}
      {mode === 'explorer' && (
        <div className={styles.marginWrap}>
          <div className={styles.marginLabel}>
            <span>Margin</span>
            <span>{isProfitable ? `${margin.toFixed(0)}%` : 'Loss!'}</span>
          </div>
          <div
            className={styles.marginTrack}
            role="meter"
            aria-valuenow={margin}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profit margin"
          >
            <div
              className={`${styles.marginFill} ${marginFillClass}`}
              style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Demand indicator ─────────────────────── */}
      <div className={styles.demandSection}>
        <span className={styles.demandLabel}>
          {mode === 'junior' ? 'Customers' : 'Predicted demand'}
        </span>
        {mode === 'junior' ? (
          <div className={styles.demandFaces} aria-label={`Demand level: ${demandLevel + 1} of 3`}>
            {FACES.map((face, i) => (
              <span
                key={face}
                className={`${styles.demandFace} ${i <= demandLevel ? styles.faceActive : styles.faceInactive}`}
                aria-hidden="true"
              >
                {face}
              </span>
            ))}
          </div>
        ) : (
          <span className={`${styles.demandText} ${demandTxtClass}`}>
            {FACES[demandLevel]} ~{predictedSales} customers/round
          </span>
        )}
      </div>

      {/* ── Disclaimer ───────────────────────────── */}
      <p className={styles.disclaimer}>
        For entertainment only — not financial advice.
      </p>
    </article>
  );
}
