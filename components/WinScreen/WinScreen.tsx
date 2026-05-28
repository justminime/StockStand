'use client';

import { PRODUCTS } from '@/lib/game-engine';
import type { GameState, ProductId } from '@/types/game';
import styles from './WinScreen.module.css';

interface WinScreenProps {
  state:          GameState;
  reason:         'goal' | 'session-end';
  onPlayAgain:    () => void;
  onKeepPlaying:  () => void;
}

const GOAL_AMOUNT = 100;

export default function WinScreen({ state, reason, onPlayAgain, onKeepPlaying }: WinScreenProps) {
  const netProfit    = state.totalRevenue - state.totalCosts;
  const roundsPlayed = Math.max(0, state.round - 1);

  // Best seller by last-round revenue (available without historical accumulation)
  const bestId = state.selectedProducts.length > 0
    ? state.selectedProducts.reduce<ProductId>((best, id) =>
        (state.products[id]?.revenue ?? 0) > (state.products[best]?.revenue ?? 0) ? id : best,
        state.selectedProducts[0]
      )
    : null;

  const isGoalReason = reason === 'goal';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={isGoalReason ? 'Goal reached!' : 'Session summary'}>
      <div className={styles.card}>

        {/* Trophy / star */}
        <div className={styles.trophy} aria-hidden="true">
          {isGoalReason ? '🏆' : '🌟'}
        </div>

        <h1 className={styles.heading}>
          {isGoalReason ? 'You hit your goal!' : 'Great session!'}
        </h1>
        <p className={styles.standName}>{state.standName || 'My Stand'}</p>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>${state.coins.toFixed(2)}</span>
            <span className={styles.statLabel}>Balance</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${netProfit >= 0 ? styles.positive : styles.negative}`}>
              {netProfit >= 0 ? '+' : '−'}${Math.abs(netProfit).toFixed(2)}
            </span>
            <span className={styles.statLabel}>Net profit</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{roundsPlayed}</span>
            <span className={styles.statLabel}>Rounds played</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{state.unlockedCards.length}</span>
            <span className={styles.statLabel}>Cards unlocked</span>
          </div>
        </div>

        {/* Best seller highlight */}
        {bestId && state.products[bestId]?.revenue > 0 && (
          <div className={styles.highlight}>
            <span aria-hidden="true">{PRODUCTS[bestId].emoji}</span>
            {' '}Star product this round:{' '}
            <strong>{PRODUCTS[bestId].label}</strong>
          </div>
        )}

        {/* Learning nugget */}
        <div className={styles.lesson}>
          {isGoalReason
            ? '💡 You just learned: consistent pricing beats random luck every time.'
            : '💡 Try adjusting prices next time — small changes can make a big difference!'}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {isGoalReason ? (
            <>
              <button className={styles.btnSecondary} onClick={onKeepPlaying}>
                🎮 Keep playing
              </button>
              <button className={styles.btnPrimary} onClick={onPlayAgain}>
                🔄 New game
              </button>
            </>
          ) : (
            <>
              <button className={styles.btnSecondary} onClick={onKeepPlaying}>
                ← Back to game
              </button>
              <button className={styles.btnPrimary} onClick={onPlayAgain}>
                🔄 Play again
              </button>
            </>
          )}
        </div>

        {/* Goal progress if in sandbox mode near the goal */}
        {!isGoalReason && state.coins < GOAL_AMOUNT && (
          <p className={styles.goalHint}>
            You&apos;re ${(GOAL_AMOUNT - state.coins).toFixed(2)} away from the $100 goal!
          </p>
        )}

        <p className={styles.disclaimer}>
          For educational entertainment only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
