'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameEvent } from '@/types/game';
import styles from './EventBanner.module.css';

interface EventBannerProps {
  event:     GameEvent | null;
  onDismiss: () => void;
}

function formatEffect(effect: GameEvent['effect']): { text: string; isUp: boolean } {
  const pct = Math.round(Math.abs(effect.modifier) * 100);
  const isUp = effect.modifier >= 0;

  if (effect.target === 'demandMult') {
    return {
      text: isUp ? `⬆ Demand +${pct}%` : `⬇ Demand -${pct}%`,
      isUp,
    };
  }
  // costMult — negative modifier = cost decrease = good
  return {
    text: isUp ? `⬆ Costs +${pct}%` : `⬇ Costs -${pct}%`,
    isUp: !isUp,
  };
}

export default function EventBanner({ event, onDismiss }: EventBannerProps) {
  const [exiting, setExiting] = useState(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!event) {
      setExiting(false);
      return;
    }

    // Auto-dismiss after 4 seconds
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  function handleDismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setExiting(false);
      onDismiss();
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  if (!event) return null;

  const typeClass = styles[event.type as keyof typeof styles] ?? styles.neutral;
  const { text: effectText, isUp } = formatEffect(event.effect);

  return (
    <div
      className={`${styles.banner} ${typeClass} ${exiting ? styles.bannerExiting : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.emoji} aria-hidden="true">
        {event.emoji}
      </span>
      <div className={styles.content}>
        <p className={styles.title}>{event.title}</p>
        <p className={styles.message}>{event.message}</p>
        <p className={`${styles.effect} ${isUp ? styles.effectUp : styles.effectDown}`}>
          {effectText}
        </p>
      </div>
      <button
        className={styles.dismiss}
        onClick={handleDismiss}
        aria-label="Dismiss event"
      >
        ×
      </button>
    </div>
  );
}
