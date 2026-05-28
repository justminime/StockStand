'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialState, simulateRound, MARKET_CARDS } from '@/lib/game-engine';
import { loadFromStorage, saveToStorage, clearStorage, syncToDatabase, loadFromDatabase } from '@/lib/sync';
import type { GameState, ProductId, DisplayMode, StandTheme, AgeTier } from '@/types/game';

const SAVE_DEBOUNCE_MS = 500;

export function useGameState() {
  const [state, setState]     = useState<GameState>(() => createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount; fall back to DB for cross-device sync
  useEffect(() => {
    async function loadState() {
      const local = loadFromStorage();
      if (local) {
        setState(local);
      } else {
        // No local save — try DB (returning player on a new device)
        const remote = await loadFromDatabase();
        if (remote) {
          setState(remote);
          saveToStorage(remote); // cache locally so next load is instant
        }
      }
      setIsLoaded(true);
    }
    loadState();
  }, []);

  // Debounced save: localStorage (primary) + DB (secondary, fire-and-forget)
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToStorage(state);
      syncToDatabase(state); // no-op for children / unauthenticated users
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, isLoaded]);

  const runRound = useCallback((currentPrices: Record<string, number>) => {
    setState(prev => {
      const { newState } = simulateRound(prev, currentPrices);
      return newState;
    });
  }, []);

  const setPrice = useCallback((productId: ProductId, price: number) => {
    setState(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [productId]: { ...prev.products[productId], price },
      },
    }));
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setState(prev => ({ ...prev, displayMode: mode }));
  }, []);

  const setStandName = useCallback((name: string) => {
    setState(prev => ({ ...prev, standName: name }));
  }, []);

  const completeOnboarding = useCallback((opts: {
    standName:        string;
    displayMode:      DisplayMode;
    winCondition:     'goal' | 'sandbox';
    selectedProducts: ProductId[];
    ageTier:          AgeTier;
  }) => {
    setState(prev => ({
      ...prev,
      standName:        opts.standName,
      displayMode:      opts.displayMode,
      winCondition:     opts.winCondition,
      selectedProducts: opts.selectedProducts,
      ageTier:          opts.ageTier,
      onboardingDone:   true,
    }));
  }, []);

  const resetGame = useCallback(() => {
    clearStorage();
    setState(createInitialState());
  }, []);

  const getNewlyUnlockedCards = useCallback((prevState: GameState, newState: GameState) => {
    const prev = new Set(prevState.unlockedCards);
    return newState.unlockedCards.filter(id => !prev.has(id));
  }, []);

  /** Adds Mystery Sip (GME) to selectedProducts — called at round 5 */
  const unlockMysteryProduct = useCallback(() => {
    setState(prev => {
      if (prev.selectedProducts.includes('mystery')) return prev;
      return { ...prev, selectedProducts: [...prev.selectedProducts, 'mystery'] };
    });
  }, []);

  /** Switches the stand background theme */
  const setTheme = useCallback((theme: StandTheme) => {
    setState(prev => ({ ...prev, standTheme: theme }));
  }, []);

  /** Switches goal/sandbox win condition (e.g. after reaching goal, continue in sandbox) */
  const setWinCondition = useCallback((winCondition: 'goal' | 'sandbox') => {
    setState(prev => ({ ...prev, winCondition }));
  }, []);

  return {
    state,
    isLoaded,
    runRound,
    setPrice,
    setDisplayMode,
    setStandName,
    completeOnboarding,
    resetGame,
    getNewlyUnlockedCards,
    unlockMysteryProduct,
    setTheme,
    setWinCondition,
    MARKET_CARDS,
  };
}
