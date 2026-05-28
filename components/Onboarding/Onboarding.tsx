'use client';

import { useState } from 'react';
import { PRODUCTS } from '@/lib/game-engine';
import type { AgeTier, DisplayMode, ProductId } from '@/types/game';
import styles from './Onboarding.module.css';

interface OnboardingProps {
  ageTier:    AgeTier;
  onComplete: (opts: {
    standName:        string;
    displayMode:      DisplayMode;
    winCondition:     'goal' | 'sandbox';
    selectedProducts: ProductId[];
  }) => void;
}

// Mystery Sip (GME) is progression-locked — auto-unlocks at round 5, hidden here
const ALL_PRODUCTS: ProductId[] = ['lemonade', 'juice', 'cookies', 'tea'];

export default function Onboarding({ ageTier, onComplete }: OnboardingProps) {
  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [standName, setName]  = useState('');
  const [selected, setSelected] = useState<Set<ProductId>>(new Set(['lemonade', 'cookies']));
  // Auto-set mode from age tier; user can change in step 3
  const [displayMode, setMode] = useState<DisplayMode>(ageTier === 'child' ? 'junior' : 'explorer');

  function toggleProduct(id: ProductId) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 2) return prev;  // require at least 2
        next.delete(id);
      } else {
        if (next.size >= 3) return prev;  // cap at 3 for a manageable start
        next.add(id);
      }
      return next;
    });
  }

  function finish() {
    onComplete({
      standName:        standName.trim() || 'My Lemonade Stand',
      displayMode,
      winCondition:     'sandbox',
      selectedProducts: Array.from(selected),
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Step dots */}
        <div className={styles.steps} aria-label="Setup progress, step {step} of 3">
          {([1, 2, 3] as const).map(n => (
            <div
              key={n}
              className={`${styles.dot} ${step >= n ? styles.dotActive : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* ─── Step 1: Name ─────────────────────────────── */}
        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.emoji} aria-hidden="true">🍋</div>
            <h1 className={styles.heading}>Welcome to StockStand!</h1>
            <p className={styles.body}>
              You&apos;re about to open your own stand — and secretly learn how
              the stock market works while you do it.
            </p>

            <label className={styles.label} htmlFor="stand-name">
              What&apos;s your stand called?
            </label>
            <input
              id="stand-name"
              className={styles.input}
              type="text"
              placeholder="Sunny Sips Co."
              maxLength={30}
              value={standName}
              onChange={e => setName(e.target.value)}
              autoFocus
            />

            <button className={styles.btnPrimary} onClick={() => setStep(2)}>
              Let&apos;s go →
            </button>
          </div>
        )}

        {/* ─── Step 2: Products ─────────────────────────── */}
        {step === 2 && (
          <div className={styles.step}>
            <h2 className={styles.heading}>Pick 2–3 products to sell</h2>
            <p className={styles.body}>
              You can expand your menu as you grow and earn more!
            </p>

            <div className={styles.productGrid}>
              {ALL_PRODUCTS.map(id => {
                const def      = PRODUCTS[id];
                const isChosen = selected.has(id);
                return (
                  <button
                    key={id}
                    className={`${styles.productBtn} ${isChosen ? styles.productChosen : ''}`}
                    onClick={() => toggleProduct(id)}
                    aria-pressed={isChosen}
                  >
                    <span className={styles.productEmoji} aria-hidden="true">{def.emoji}</span>
                    <span className={styles.productLabel}>{def.label}</span>
                    {isChosen && <span className={styles.checkmark} aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>

            <p className={styles.hint}>
              {selected.size < 2
                ? 'Pick at least 2 products'
                : selected.size === 3
                ? 'Max 3 at start — you can unlock more later'
                : `${selected.size} selected — you can pick one more`}
            </p>

            <div className={styles.navRow}>
              <button className={styles.btnSecondary} onClick={() => setStep(1)}>← Back</button>
              <button
                className={styles.btnPrimary}
                onClick={() => setStep(3)}
                disabled={selected.size < 2}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Mode ─────────────────────────────── */}
        {step === 3 && (
          <div className={styles.step}>
            <h2 className={styles.heading}>How do you want to play?</h2>
            <p className={styles.body}>You can switch modes any time from the header.</p>

            <div className={styles.modeGrid}>
              <button
                className={`${styles.modeBtn} ${displayMode === 'junior' ? styles.modeActive : ''}`}
                onClick={() => setMode('junior')}
                aria-pressed={displayMode === 'junior'}
              >
                <span className={styles.modeEmoji} aria-hidden="true">🌟</span>
                <span className={styles.modeTitle}>Junior</span>
                <span className={styles.modeDesc}>Ages 6+ · Coins &amp; smiley faces</span>
              </button>

              <button
                className={`${styles.modeBtn} ${displayMode === 'explorer' ? styles.modeActive : ''}`}
                onClick={() => setMode('explorer')}
                aria-pressed={displayMode === 'explorer'}
              >
                <span className={styles.modeEmoji} aria-hidden="true">📈</span>
                <span className={styles.modeTitle}>Explorer</span>
                <span className={styles.modeDesc}>Ages 11+ · Charts &amp; real numbers</span>
              </button>
            </div>

            <div className={styles.navRow}>
              <button className={styles.btnSecondary} onClick={() => setStep(2)}>← Back</button>
              <button className={styles.btnPrimary} onClick={finish}>
                🍋 Open for business!
              </button>
            </div>
          </div>
        )}

        <p className={styles.disclaimer}>
          For educational entertainment only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
