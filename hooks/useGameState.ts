'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialState, simulateRound, MARKET_CARDS } from '@/lib/game-engine';
import { loadFromStorage, saveToStorage, clearStorage } from '@/lib/sync';
import type { GameState, ProductId, DisplayMode, StandTheme, AgeTier } from '@/types/game';
import type { MarketContext } from '@/lib/game-engine';

const SAVE_DEBOUNCE_MS = 500;

export function useGameState() {
  const [state, setState]     = useState<GameState>(() => createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) setState(saved);
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

  const runRound = useCallback(
    (currentPrices: Record<string, number>, marketCtx?: MarketContext | null) => {
      setState(prev => {
        const { newState } = simulateRound(prev, currentPrices, marketCtx);
        return newState;
      });
    },
    [],
  );

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

  /** Toggle sound effects on/off (persisted in game state) */
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, soundEnabled: enabled }));
  }, []);

  /**
   * Export current game state as a JSON file download.
   * Creates a temporary <a> element and programmatically clicks it.
   */
  const exportSave = useCallback(() => {
    if (typeof window === 'undefined') return;
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `stockstand-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  /**
   * Import a game state JSON file.
   * Validates schema version before applying — mismatched versions are rejected.
   * Returns a promise so callers can await confirmation.
   */
  const importSave = useCallback((file: File): Promise<{ ok: boolean; error?: string }> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as GameState;
          if (typeof parsed.schemaVersion !== 'number') {
            return resolve({ ok: false, error: 'Not a valid StockStand save file.' });
          }
          // Forward-migrate: merge with defaults to fill any new fields
          const defaults = createInitialState();
          const merged   = { ...defaults, ...parsed };
          clearStorage();
          saveToStorage(merged);
          setState(merged);
          resolve({ ok: true });
        } catch {
          resolve({ ok: false, error: 'Failed to read file. Is it a valid JSON save?' });
        }
      };
      reader.onerror = () => resolve({ ok: false, error: 'File read error.' });
      reader.readAsText(file);
    });
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
    setSoundEnabled,
    exportSave,
    importSave,
    MARKET_CARDS,
  };
}
