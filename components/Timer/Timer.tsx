'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Timer.module.css';

interface TimerProps {
  totalSeconds: number;
  onExpire:     () => void;
  paused?:      boolean;
}

const RADIUS        = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * SVG ring countdown timer.
 * Mount with a new `key` prop to reset between rounds.
 */
export default function Timer({ totalSeconds, onExpire, paused = false }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  const firedRef    = useRef(false);
  onExpireRef.current = onExpire;

  // Reset when remounted (key change from parent)
  useEffect(() => {
    setRemaining(totalSeconds);
    firedRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (paused || firedRef.current) return;
    if (remaining <= 0) {
      firedRef.current = true;
      onExpireRef.current();
      return;
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1_000);
    return () => clearTimeout(id);
  }, [remaining, paused]);

  const progress         = remaining / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const strokeColor      =
    progress > 0.5  ? 'var(--green)'  :
    progress > 0.25 ? 'var(--yellow)' :
    'var(--red)';

  return (
    <div
      className={`${styles.wrap} ${paused ? styles.paused : ''}`}
      role="timer"
      aria-label={`${remaining} seconds remaining`}
    >
      <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden="true">
        {/* Track ring */}
        <circle
          cx={32} cy={32} r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={5}
        />
        {/* Progress ring — depletes clockwise from top */}
        <circle
          cx={32} cy={32} r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className={styles.count} aria-hidden="true">
        {remaining}
      </span>
    </div>
  );
}
