'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useStockPrices } from '@/hooks/useStockPrices';
import { PRODUCTS, MARKET_CARDS as ALL_MARKET_CARDS } from '@/lib/game-engine';
import ProductCard from '@/components/ProductCard/ProductCard';
import StockTicker from '@/components/StockTicker/StockTicker';
import EventBanner from '@/components/EventBanner/EventBanner';
import MarketCard  from '@/components/MarketCard/MarketCard';
import ModeToggle  from '@/components/ModeToggle/ModeToggle';
import StatsBar    from '@/components/StatsBar/StatsBar';
import Timer       from '@/components/Timer/Timer';
import type { GameEvent } from '@/types/game';
import styles from './GameBoard.module.css';

/** Fallback prices used when the API is unavailable */
const FALLBACK: Record<string, number> = {
  AAPL: 189.50, TSLA: 248.00, MCD: 287.50, KO: 61.20, GME: 14.75,
};

const ROUND_SECONDS = 60;

export default function GameBoard() {
  const {
    state,
    isLoaded,
    runRound,
    setPrice,
    setDisplayMode,
    resetGame,
  } = useGameState();

  const {
    prices,
    prevPrices,
    loading: pricesLoading,
    error:   pricesError,
    getStockDelta,
  } = useStockPrices();

  // Round lifecycle
  const [roundKey,      setRoundKey]    = useState(0);    // increment → Timer remounts
  const [timerPaused,   setPaused]      = useState(false);
  const [activeEvent,   setActiveEvent] = useState<GameEvent | null>(null);
  const [newCardIds,    setNewCardIds]  = useState<string[]>([]);
  const processingRef   = useRef(false);
  const prevRoundRef    = useRef<number>(0);
  const prevUnlockedRef = useRef<string[]>([]);

  // Sync refs once state is loaded from localStorage
  useEffect(() => {
    if (!isLoaded) return;
    prevRoundRef.current    = state.round;
    prevUnlockedRef.current = state.unlockedCards;
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect round completion — fires whenever state.round increments
  useEffect(() => {
    if (!isLoaded) return;
    if (state.round === prevRoundRef.current) return;

    // Diff unlocked cards
    const prevSet = new Set(prevUnlockedRef.current);
    const fresh   = state.unlockedCards.filter(id => !prevSet.has(id));
    prevUnlockedRef.current = state.unlockedCards;
    prevRoundRef.current    = state.round;

    if (fresh.length > 0)    setNewCardIds(fresh);
    if (state.currentEvent)  setActiveEvent(state.currentEvent);

    // Reset processing guard and restart timer
    processingRef.current = false;
    setPaused(false);
    setRoundKey(k => k + 1);
  }, [state.round, state.currentEvent, state.unlockedCards, isLoaded]);

  /** Called when the round timer hits zero */
  const handleRoundEnd = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;
    setPaused(true);

    const currentPrices = Object.keys(prices).length > 0 ? { ...prices } : { ...FALLBACK };
    runRound(currentPrices);
  }, [prices, runRound]);

  if (!isLoaded) return null;

  const { displayMode: mode } = state;
  const unlockedSet  = new Set(state.unlockedCards);
  const unlockedCards = ALL_MARKET_CARDS.filter(c => unlockedSet.has(c.id));

  return (
    <div className={styles.layout}>

      {/* ── Sticky Header ───────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logoEmoji} aria-hidden="true">🍋</span>
          <h1 className={styles.standName}>{state.standName || 'My Stand'}</h1>
        </div>

        <div className={styles.headerRight}>
          {pricesError && !pricesLoading && (
            <span className={styles.offlineBadge} title="Could not fetch live prices — using estimates">
              ⚠️ offline
            </span>
          )}
          <Timer
            key={roundKey}
            totalSeconds={ROUND_SECONDS}
            onExpire={handleRoundEnd}
            paused={timerPaused}
          />
          <ModeToggle mode={mode} onChange={setDisplayMode} />
        </div>
      </header>

      {/* ── Stock Ticker (Explorer only) ─────────────── */}
      {mode === 'explorer' && Object.keys(prices).length > 0 && (
        <StockTicker prices={prices} prevPrices={prevPrices} mode={mode} />
      )}

      {/* ── Event Banner ─────────────────────────────── */}
      <div className={styles.bannerSlot}>
        <EventBanner event={activeEvent} onDismiss={() => setActiveEvent(null)} />
      </div>

      {/* ── Round badge + hint ───────────────────────── */}
      <div className={styles.roundRow}>
        <span className={styles.roundBadge}>Round {state.round}</span>
        <span className={styles.roundHint}>
          {timerPaused
            ? '⏳ Tallying results…'
            : 'Adjust prices — round ends when the timer runs out!'}
        </span>
      </div>

      {/* ── Product Cards grid ───────────────────────── */}
      <main className={styles.cardsGrid} aria-label="Your products">
        {state.selectedProducts.map(id => (
          <ProductCard
            key={id}
            productId={id}
            product={state.products[id]}
            costMult={state.costMult}
            demandMult={state.demandMult}
            stockDelta={getStockDelta(PRODUCTS[id].stockSymbol)}
            priceHistory={state.priceHistory[id] ?? []}
            mode={mode}
            onPriceChange={setPrice}
          />
        ))}
      </main>

      {/* ── Unlocked Market Cards ────────────────────── */}
      {unlockedCards.length > 0 && (
        <section className={styles.cardsSection} aria-label="Your market cards">
          <h2 className={styles.sectionTitle}>📋 Market Cards</h2>
          <div className={styles.cardsScroll}>
            {unlockedCards.map(card => (
              <MarketCard
                key={card.id}
                card={card}
                isNew={newCardIds.includes(card.id)}
                isActive={state.activeCards.includes(card.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── New card unlocked toast ───────────────────── */}
      {newCardIds.length > 0 && (
        <div
          className={styles.toast}
          role="status"
          aria-live="polite"
          onClick={() => setNewCardIds([])}
        >
          🎉 New card unlocked! Tap to dismiss
        </div>
      )}

      {/* ── Reset link (small, accessible) ──────────── */}
      <div className={styles.resetRow}>
        <button
          className={styles.resetBtn}
          onClick={() => { if (confirm('Reset game? All progress will be lost.')) resetGame(); }}
        >
          ↩ Reset game
        </button>
      </div>

      {/* ── Stats Bar (pinned to bottom) ─────────────── */}
      <StatsBar state={state} mode={mode} />
    </div>
  );
}
