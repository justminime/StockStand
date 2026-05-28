'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialState, simulateRound, MARKET_CARDS } from '@/lib/game-engine';
import { loadFromStorage, saveToStorage, clearStorage } from '@/lib/sync';
import type { GameState, ProductId, DisplayMode } from '@/types/game';

const SAVE_DEBOUNCE_MS = 500;

export function useGameState() {
  const [state, setState]     = useState<GameState>(() => createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setState(saved);
    }
    setIsLoaded(true);
  }, []);

  // Debounced save to localStorage on every state change
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToStorage(state);
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
  }) => {
    setState(prev => ({
      ...prev,
      standName:        opts.standName,
      displayMode:      opts.displayMode,
      winCondition:     opts.winCondition,
      selectedProducts: opts.selectedProducts,
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
    MARKET_CARDS,
  };
}
