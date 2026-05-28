'use client';

import type { MarketCard as MarketCardType } from '@/types/game';
import styles from './MarketCard.module.css';

interface MarketCardProps {
  card:      MarketCardType;
  isNew?:    boolean;
  isActive?: boolean;
  isLocked?: boolean;
}

function formatEffect(effect: MarketCardType['effect']): string {
  const pct  = Math.round(Math.abs(effect.modifier) * 100);
  const sign = effect.modifier >= 0 ? '+' : '-';
  const dur  = effect.duration;

  if (effect.target === 'demandMult') {
    return `${sign}${pct}% demand for ${dur} round${dur !== 1 ? 's' : ''}`;
  }
  if (effect.target === 'costMult') {
    return `${sign}${pct}% costs for ${dur} round${dur !== 1 ? 's' : ''}`;
  }
  return `${sign}${pct}% price for ${dur} round${dur !== 1 ? 's' : ''}`;
}

function isRare(effect: MarketCardType['effect']): boolean {
  return effect.target === 'demandMult' && Math.abs(effect.modifier) > 0.4;
}

export default function MarketCard({ card, isNew, isActive, isLocked }: MarketCardProps) {
  const rare = isRare(card.effect);

  const cardClasses = [
    styles.card,
    rare     ? styles.cardRare   : '',
    isLocked ? styles.cardLocked : '',
    isActive ? styles.cardActive : '',
    isNew    ? styles.cardNew    : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} role="article" aria-label={`Market card: ${card.name}`}>
      {isActive && (
        <span className={styles.activeBadge} aria-label="Currently active">
          Active
        </span>
      )}

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.emoji} aria-hidden="true">{card.emoji}</span>
          <h3 className={styles.name}>{card.name}</h3>
        </div>
        <span className={`${styles.rarityBadge} ${rare ? styles.rarityRare : styles.rarityCommon}`}>
          {rare ? 'rare' : 'common'}
        </span>
      </div>

      <p className={styles.description}>{card.description}</p>

      <p className={styles.effectRow}>
        <span>Effect:</span>
        <span>{formatEffect(card.effect)}</span>
      </p>
    </div>
  );
}
