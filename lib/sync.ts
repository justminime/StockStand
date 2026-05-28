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

// ─── DB sync (localStorage primary, Supabase/Postgres secondary) ──────────────

/**
 * Fire-and-forget sync to the DB.
 * - Skipped entirely for under-13 (COPPA) and for sessions without ageTier
 * - Silently ignored if the user isn't signed in (API returns 401)
 * - Never blocks the game — localStorage is always the source of truth
 */
export async function syncToDatabase(state: GameState): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!state.ageTier || state.ageTier === 'child') return; // COPPA guard
  try {
    fetch('/api/game-state', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ gameState: state, ageTier: state.ageTier }),
    }).catch(() => { /* silently ignore network errors */ });
  } catch {
    // Ignore — DB is secondary
  }
}

/**
 * Load game state from DB (called on mount when localStorage is empty).
 * Used for cross-device sync: returning player on a new device gets their save.
 */
export async function loadFromDatabase(): Promise<GameState | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/game-state');
    if (!res.ok) return null;
    const data = await res.json() as { gameState: GameState | null } | null;
    return data?.gameState ?? null;
  } catch {
    return null;
  }
}
