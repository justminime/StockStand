import type { DisplayMode } from '@/types/game';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode:     DisplayMode;
  onChange: (mode: DisplayMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={mode === 'explorer'}
      className={`${styles.toggle} ${mode === 'junior' ? styles.junior : styles.explorer}`}
      onClick={() => onChange(mode === 'junior' ? 'explorer' : 'junior')}
    >
      {mode === 'junior' ? '🌟 Junior' : '📈 Explorer'}
    </button>
  );
}
