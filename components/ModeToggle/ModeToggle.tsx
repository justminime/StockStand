import type { DisplayMode } from '@/types/game';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode:     DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const isJunior = mode === 'junior';
  return (
    <button
      role="switch"
      aria-checked={!isJunior}
      aria-label={isJunior ? 'Switch to Explorer mode' : 'Switch to Junior mode'}
      className={`${styles.toggle} ${isJunior ? styles.junior : styles.explorer}`}
      onClick={() => onChange(isJunior ? 'explorer' : 'junior')}
    >
      {/* emoji always shown; text hidden on small screens via CSS */}
      <span aria-hidden="true">{isJunior ? '🌟' : '📈'}</span>
      <span className={styles.label}>{isJunior ? ' Junior' : ' Explorer'}</span>
    </button>
  );
}
