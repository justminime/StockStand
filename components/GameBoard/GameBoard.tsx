'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState }    from '@/hooks/useGameState';
import { useStockPrices }  from '@/hooks/useStockPrices';
import { PRODUCTS, MARKET_CARDS as ALL_MARKET_CARDS } from '@/lib/game-engine';
import ProductCard from '@/components/ProductCard/ProductCard';
import StockTicker from '@/components/StockTicker/StockTicker';
import EventBanner from '@/components/EventBanner/EventBanner';
import MarketCard  from '@/components/MarketCard/MarketCard';
import ModeToggle  from '@/components/ModeToggle/ModeToggle';
import StatsBar    from '@/components/StatsBar/StatsBar';
import Timer       from '@/components/Timer/Timer';
import GoalBar      from '@/components/GoalBar/GoalBar';
import WinScreen    from '@/components/WinScreen/WinScreen';
import ReturnScreen from '@/components/ReturnScreen/ReturnScreen';
import type { GameEvent } from '@/types/game';
import styles from './GameBoard.module.css';

/** Fallback prices used when the API is unavailable */
const FALLBACK: Record<string, number> = {
  AAPL: 189.50, TSLA: 248.00, MCD: 287.50, KO: 61.20, GME: 14.75,
};

const ROUND_SECONDS = 60;
const GOAL_AMOUNT   = 100;

// GME auto-unlock round
const MYSTERY_UNLOCK_ROUND = 5;

// Stand theme labels / emojis
const THEMES = [
  { id: 'street', emoji: '🏙️', label: 'Street' },
  { id: 'beach',  emoji: '🏖️', label: 'Beach'  },
  { id: 'park',   emoji: '🌳', label: 'Park'   },
] as const;

export default function GameBoard() {
  const {
    state,
    isLoaded,
    runRound,
    setPrice,
    setDisplayMode,
    resetGame,
    unlockMysteryProduct,
    setTheme,
    setWinCondition,
  } = useGameState();

  // ── "You were away" return screen ───────────────
  // Check once on first load: if lastSaved was > 24 h ago and the player
  // has already played at least one round, show the return screen.
  const hasCheckedReturnRef = useRef(false);
  const [showReturnScreen,  setShowReturnScreen]  = useState(false);

  const {
    prices,
    prevPrices,
    loading: pricesLoading,
    error:   pricesError,
    marketClosed,
    getStockDelta,
  } = useStockPrices();

  // Round lifecycle
  const [roundKey,      setRoundKey]    = useState(0);
  const [timerPaused,   setPaused]      = useState(false);
  const [activeEvent,   setActiveEvent] = useState<GameEvent | null>(null);
  const [newCardIds,    setNewCardIds]  = useState<string[]>([]);
  const processingRef   = useRef(false);
  const prevRoundRef    = useRef<number>(0);
  const prevUnlockedRef = useRef<string[]>([]);

  // Win / session-end screen
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [winReason,     setWinReason]    = useState<'goal' | 'session-end'>('goal');

  // Mystery Sip unlock toast
  const [mysteryToast, setMysteryToast] = useState(false);

  // Market-closed banner dismiss
  const [closedDismissed, setClosedDismissed] = useState(false);

  // Sync refs once state is loaded from localStorage
  useEffect(() => {
    if (!isLoaded) return;
    prevRoundRef.current    = state.round;
    prevUnlockedRef.current = state.unlockedCards;
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Return-screen check — runs once after load, never again
  useEffect(() => {
    if (!isLoaded || hasCheckedReturnRef.current) return;
    hasCheckedReturnRef.current = true;
    if (state.round > 1 && state.lastSaved) {
      const hoursAway = (Date.now() - new Date(state.lastSaved).getTime()) / 3_600_000;
      if (hoursAway >= 24) setShowReturnScreen(true);
    }
  }, [isLoaded, state.round, state.lastSaved]);

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

    // GME (Mystery Sip) auto-unlock at round MYSTERY_UNLOCK_ROUND
    if (
      state.round >= MYSTERY_UNLOCK_ROUND &&
      !state.selectedProducts.includes('mystery')
    ) {
      unlockMysteryProduct();
      setMysteryToast(true);
      setTimeout(() => setMysteryToast(false), 5_000);
    }

    // Reset processing guard and restart timer
    processingRef.current = false;
    setPaused(false);
    setRoundKey(k => k + 1);
  }, [state.round, state.currentEvent, state.unlockedCards, state.selectedProducts, isLoaded, unlockMysteryProduct]);

  // Win detection — goal mode: trigger WinScreen when coins cross threshold
  useEffect(() => {
    if (!isLoaded) return;
    if (showWinScreen) return; // already showing
    if (state.winCondition === 'goal' && state.coins >= GOAL_AMOUNT) {
      setPaused(true); // pause the timer
      setWinReason('goal');
      setShowWinScreen(true);
    }
  }, [state.coins, state.winCondition, isLoaded, showWinScreen]);

  /** Called when the round timer hits zero */
  const handleRoundEnd = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;
    setPaused(true);

    const currentPrices = Object.keys(prices).length > 0 ? { ...prices } : { ...FALLBACK };
    runRound(currentPrices);
  }, [prices, runRound]);

  const handleEndSession = useCallback(() => {
    setPaused(true);
    setWinReason('session-end');
    setShowWinScreen(true);
  }, []);

  const handleKeepPlaying = useCallback(() => {
    if (winReason === 'goal') {
      setWinCondition('sandbox'); // continue in sandbox after reaching goal
    }
    setShowWinScreen(false);
    setPaused(false);
  }, [winReason, setWinCondition]);

  const handlePlayAgain = useCallback(() => {
    setShowWinScreen(false);
    resetGame();
  }, [resetGame]);

  if (!isLoaded) return null;

  const { displayMode: mode } = state;
  const unlockedSet   = new Set(state.unlockedCards);
  const unlockedCards = ALL_MARKET_CARDS.filter(c => unlockedSet.has(c.id));
  const theme         = state.standTheme ?? 'street';
  const daysAway      = Math.floor((Date.now() - new Date(state.lastSaved).getTime()) / 86_400_000);

  const showClosedBanner = marketClosed && !closedDismissed;

  return (
    <div className={styles.layout} data-theme={theme}>

      {/* ── Return screen (> 24 h away) ─────────────── */}
      {showReturnScreen && Object.keys(prices).length > 0 && (
        <ReturnScreen
          standName={state.standName || 'Stand'}
          daysAway={Math.max(1, daysAway)}
          savedPrices={state.stockPrices}
          currentPrices={prices}
          onDismiss={() => setShowReturnScreen(false)}
        />
      )}

      {/* ── Win Screen overlay ───────────────────────── */}
      {showWinScreen && (
        <WinScreen
          state={state}
          reason={winReason}
          onPlayAgain={handlePlayAgain}
          onKeepPlaying={handleKeepPlaying}
        />
      )}

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

      {/* ── Goal progress bar (goal mode only) ──────── */}
      {state.winCondition === 'goal' && (
        <GoalBar coins={state.coins} goal={GOAL_AMOUNT} />
      )}

      {/* ── Market-closed banner ─────────────────────── */}
      {showClosedBanner && (
        <div className={styles.closedBanner} role="status">
          <span aria-hidden="true">🔔</span>
          <span>NYSE is closed right now — prices are from the last trading session.</span>
          <button
            className={styles.closedDismiss}
            onClick={() => setClosedDismissed(true)}
            aria-label="Dismiss market closed notice"
          >
            ✕
          </button>
        </div>
      )}

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
      {newCardIds.length > 0 && !mysteryToast && (
        <div
          className={styles.toast}
          role="status"
          aria-live="polite"
          onClick={() => setNewCardIds([])}
        >
          🎉 New card unlocked! Tap to dismiss
        </div>
      )}

      {/* ── Mystery Sip unlock toast ──────────────────── */}
      {mysteryToast && (
        <div
          className={`${styles.toast} ${styles.toastMystery}`}
          role="status"
          aria-live="polite"
          onClick={() => setMysteryToast(false)}
        >
          ⭐ Mystery Sip unlocked! The wild card is now in play.
        </div>
      )}

      {/* ── Settings row: theme + end session ────────── */}
      <div className={styles.settingsRow}>

        {/* Stand theme picker */}
        <div className={styles.themePicker} role="group" aria-label="Stand theme">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`${styles.themeBtn} ${theme === t.id ? styles.themeBtnActive : ''}`}
              onClick={() => setTheme(t.id)}
              aria-label={`${t.label} theme`}
              aria-pressed={theme === t.id}
              title={t.label}
            >
              {t.emoji}
            </button>
          ))}
        </div>

        {/* End session */}
        <button className={styles.endSessionBtn} onClick={handleEndSession}>
          🏁 End session
        </button>

        {/* Reset */}
        <button
          className={styles.resetBtn}
          onClick={() => { if (confirm('Reset game? All progress will be lost.')) resetGame(); }}
        >
          ↩ Reset
        </button>
      </div>

      {/* ── Stats Bar (pinned to bottom) ─────────────── */}
      <StatsBar state={state} mode={mode} />
    </div>
  );
}
