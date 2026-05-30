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
    goalAmount:       number;
    selectedProducts: ProductId[];
    ageTier:          AgeTier;
  }) => void;
}

// Mystery Sip (GME) is progression-locked — auto-unlocks at round 5
const ALL_PRODUCTS: ProductId[] = ['lemonade', 'juice', 'cookies', 'tea'];

// Goal amount presets (coins)
const GOAL_PRESETS = [50, 100, 200, 500] as const;

export default function Onboarding({ ageTier, onComplete }: OnboardingProps) {
  const [step, setStep]     = useState<1 | 2 | 3>(1);
  const [standName, setName] = useState('');
  const [selected, setSelected] = useState<Set<ProductId>>(new Set(['lemonade', 'cookies']));
  const [displayMode, setMode]  = useState<DisplayMode>(ageTier === 'child' ? 'junior' : 'explorer');
  const [winCondition, setWin]  = useState<'goal' | 'sandbox'>('goal');
  const [goalAmount, setGoal]   = useState<number>(100);
  const [customGoal, setCustomGoal] = useState('');

  function toggleProduct(id: ProductId) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;   // must keep at least 1
        next.delete(id);
      } else {
        // All 4 visible products can be selected from the start
        next.add(id);
      }
      return next;
    });
  }

  function handleCustomGoal(val: string) {
    setCustomGoal(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 10) setGoal(n);
  }

  function finish() {
    onComplete({
      standName:        standName.trim() || 'My Lemonade Stand',
      displayMode,
      winCondition,
      goalAmount:       winCondition === 'goal' ? goalAmount : 100,
      selectedProducts: Array.from(selected),
      ageTier,
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Step dots */}
        <div className={styles.steps} aria-label={`Setup progress, step ${step} of 3`}>
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
            <h2 className={styles.heading}>Pick what to sell</h2>
            <p className={styles.body}>
              Choose 1–4 products. A secret 5th unlocks as you play! 🌟
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
              {selected.size === 0
                ? 'Pick at least 1 product to start'
                : selected.size === 4
                ? 'Full menu! Tap any to remove ✓'
                : `${selected.size} selected — tap more to add`}
            </p>

            <div className={styles.navRow}>
              <button className={styles.btnSecondary} onClick={() => setStep(1)}>← Back</button>
              <button
                className={styles.btnPrimary}
                onClick={() => setStep(3)}
                disabled={selected.size < 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Mode + Goal ──────────────────────── */}
        {step === 3 && (
          <div className={styles.step}>
            <h2 className={styles.heading}>Set your style &amp; goal</h2>

            {/* Display mode */}
            <p className={styles.sectionLabel}>How do you want to play?</p>
            <div className={styles.modeGrid}>
              <button
                className={`${styles.modeBtn} ${displayMode === 'junior' ? styles.modeActive : ''}`}
                onClick={() => setMode('junior')}
                aria-pressed={displayMode === 'junior'}
              >
                <span className={styles.modeEmoji} aria-hidden="true">🌟</span>
                <span className={styles.modeTitle}>Junior</span>
                <span className={styles.modeDesc}>Ages 6+ · Coins &amp; smileys</span>
              </button>

              <button
                className={`${styles.modeBtn} ${displayMode === 'explorer' ? styles.modeActive : ''}`}
                onClick={() => setMode('explorer')}
                aria-pressed={displayMode === 'explorer'}
              >
                <span className={styles.modeEmoji} aria-hidden="true">📈</span>
                <span className={styles.modeTitle}>Explorer</span>
                <span className={styles.modeDesc}>Ages 11+ · Charts &amp; numbers</span>
              </button>
            </div>

            {/* Win condition */}
            <p className={styles.sectionLabel} style={{ marginTop: '18px' }}>Win condition</p>
            <div className={styles.modeGrid}>
              <button
                className={`${styles.modeBtn} ${winCondition === 'goal' ? styles.modeActive : ''}`}
                onClick={() => setWin('goal')}
                aria-pressed={winCondition === 'goal'}
              >
                <span className={styles.modeEmoji} aria-hidden="true">🎯</span>
                <span className={styles.modeTitle}>Goal</span>
                <span className={styles.modeDesc}>Race to earn a coin target</span>
              </button>

              <button
                className={`${styles.modeBtn} ${winCondition === 'sandbox' ? styles.modeActive : ''}`}
                onClick={() => setWin('sandbox')}
                aria-pressed={winCondition === 'sandbox'}
              >
                <span className={styles.modeEmoji} aria-hidden="true">∞</span>
                <span className={styles.modeTitle}>Sandbox</span>
                <span className={styles.modeDesc}>Play forever, no finish line</span>
              </button>
            </div>

            {/* Goal amount — only shown when goal mode selected */}
            {winCondition === 'goal' && (
              <div className={styles.goalPicker}>
                <p className={styles.sectionLabel}>Coin target</p>
                <div className={styles.goalPresets}>
                  {GOAL_PRESETS.map(g => (
                    <button
                      key={g}
                      className={`${styles.goalBtn} ${goalAmount === g && !customGoal ? styles.goalBtnActive : ''}`}
                      onClick={() => { setGoal(g); setCustomGoal(''); }}
                    >
                      ${g}
                    </button>
                  ))}
                </div>
                <div className={styles.customGoalRow}>
                  <span className={styles.customGoalPrefix}>$</span>
                  <input
                    className={styles.customGoalInput}
                    type="number"
                    min={10}
                    max={9999}
                    placeholder="custom"
                    value={customGoal}
                    onChange={e => handleCustomGoal(e.target.value)}
                    aria-label="Custom goal amount in coins"
                  />
                </div>
              </div>
            )}

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
