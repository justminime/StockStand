'use client';

import { useCallback } from 'react';
import { playSound, type SoundType } from '@/lib/sounds';

/**
 * Thin wrapper around playSound that gates playback on `enabled`.
 * Calling play() when disabled is a silent no-op.
 *
 * Usage:
 *   const { play } = useSounds(state.soundEnabled);
 *   play('coin');
 */
export function useSounds(enabled: boolean) {
  const play = useCallback(
    (type: SoundType) => {
      if (!enabled) return;
      playSound(type);
    },
    [enabled],
  );

  return { play };
}
