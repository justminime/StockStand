/**
 * Game state persistence.
 *
 * Strategy:
 * - localStorage is PRIMARY (instant reads/writes, works offline)
 * - Database is SECONDARY (sync on round end + page unload)
 *
 * Wave 5 replaces the DB stubs with real /api/game-state calls.
 */
import type { GameState } from '@/types/game';
import { createInitialState } from '@/lib/game-engine';

export const STORAGE_KEY    = 'stockstand_v1';
export const SCHEMA_VERSION = 1;

export function loadFromStorage(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    // Force fresh start on schema change
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      console.log('[sync] Schema version mismatch — clearing saved game');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Forward-migrate: fill in any fields added after the save was created
    // (new keys from createInitialState act as defaults; existing values win)
    const defaults = createInitialState();
    return { ...defaults, ...parsed };
  } catch (err) {
    console.error('[sync] Failed to load from localStorage:', err);
    return null;
  }
}

export function saveToStorage(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave = { ...state, lastSaved: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('[sync] Failed to save to localStorage:', err);
  }
}

export function clearStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── DB stubs (Wave 5 replaces these with real API calls) ─────────────────────

export async function syncToDatabase(_state: GameState): Promise<void> {
  // Wave 5: POST /api/game-state
}

export async function loadFromDatabase(): Promise<GameState | null> {
  // Wave 5: GET /api/game-state
  return null;
}
