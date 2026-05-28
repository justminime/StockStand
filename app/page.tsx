'use client';

import { useState } from 'react';
import AgeGate    from '@/components/AgeGate/AgeGate';
import Onboarding from '@/components/Onboarding/Onboarding';
import GameBoard  from '@/components/GameBoard/GameBoard';
import { useGameState } from '@/hooks/useGameState';
import type { AgeTier }  from '@/types/game';

/**
 * Root page — orchestrates the three pre-game screens:
 *   1. AgeGate     (first visit, no saved game)
 *   2. Onboarding  (name + products + mode, first visit only)
 *   3. GameBoard   (returning player, or after onboarding is done)
 */
export default function Home() {
  const { state, isLoaded, completeOnboarding } = useGameState();

  // Holds the selected age tier for the current session.
  // Stored in component state only — not persisted beyond page refresh
  // (COPPA: we intentionally don't cache age tier across sessions in MVP).
  const [ageTier, setAgeTier] = useState<AgeTier | null>(null);

  // ── Still loading from localStorage ───────────────
  if (!isLoaded) {
    return (
      <main
        style={{ minHeight: '100dvh', background: 'var(--bg)' }}
        aria-busy="true"
        aria-label="Loading…"
      />
    );
  }

  // ── Returning player → straight to the game ────────
  if (state.onboardingDone) {
    return <GameBoard />;
  }

  // ── New player: age gate first ─────────────────────
  if (!ageTier) {
    return <AgeGate onSelect={setAgeTier} />;
  }

  // ── Age selected → 3-step onboarding ──────────────
  return (
    <Onboarding
      ageTier={ageTier}
      onComplete={completeOnboarding}
    />
  );
}
