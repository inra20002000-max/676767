import type { CharacterState, LifeHistoryEvent, FocusType } from '../types/simulation';

export const SAVE_KEY = 'one8b_active_save_v2';

export interface SavedGameState {
  version: number;
  savedAt: number;
  character: CharacterState;
  currentFocus: FocusType;
  isTurbo?: boolean;
}

/**
 * Persists current in-flight life state to localStorage
 */
export function saveActiveGame(
  character: CharacterState,
  currentFocus: FocusType,
  isTurbo: boolean = false
): boolean {
  if (typeof window === 'undefined') return false;
  // If character is already deceased, do not keep active resume save
  if (!character.isAlive) {
    clearActiveSave();
    return false;
  }
  try {
    const payload: SavedGameState = {
      version: 2,
      savedAt: Date.now(),
      character,
      currentFocus,
      isTurbo,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[Storage] Failed to auto-save game:', err);
    return false;
  }
}

/**
 * Loads saved life state if present and valid
 */
export function loadActiveGame(): SavedGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameState;
    if (parsed && parsed.character && parsed.character.isAlive) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[Storage] Failed to load saved game:', err);
    return null;
  }
}

/**
 * Checks if a valid in-progress game is stored
 */
export function hasActiveSave(): boolean {
  return loadActiveGame() !== null;
}

/**
 * Clears saved game on death or new birth
 */
export function clearActiveSave(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('[Storage] Failed to clear save:', err);
  }
}
