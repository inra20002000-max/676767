import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveActiveGame,
  loadActiveGame,
  hasActiveSave,
  clearActiveSave,
  SAVE_KEY,
} from '../services/storageService';
import type { CharacterState } from '../types/simulation';

describe('Storage Service (Auto-Save & Resume)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockCharacter: CharacterState = {
    id: 'char_test_1',
    name: 'Алексей Смирнов',
    age: 24,
    sex: 'M',
    country: {
      id: 'RUS',
      nameRu: 'Россия',
      nameEn: 'Russia',
      e0: 73.2,
      e0m: 67.5,
      e0f: 79.1,
      imr: 4.5,
      u5mr: 5.6,
      tfr: 1.5,
      urb: 75.0,
      gini: 36.0,
      inc: 'UMIC',
      region: 'eca',
      wbGdpPcap: 14000,
      pop: 144000000,
      births: 1300000,
    },
    year: 2026,
    birthYear: 2002,
    stage: 'adult',
    stats: { health: 85, happiness: 75, smarts: 80, social: 70 },
    wealth: {
      quintile: 3,
      percentile: 0.55,
      incomeUSD: 16000,
      netWorthUSD: 25000,
      worldPct: 78,
    },
    flags: { smoker: false, exSmoker: false, alcoholic: false, alcControlled: false, drug: false, refugee: false, inPrison: false },
    chronicIllnesses: [],
    isAlive: true,
  };

  it('correctly saves and loads an active in-progress game', () => {
    expect(hasActiveSave()).toBe(false);

    const saved = saveActiveGame(mockCharacter, 'work', false);
    expect(saved).toBe(true);
    expect(hasActiveSave()).toBe(true);

    const loaded = loadActiveGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.character.name).toBe('Алексей Смирнов');
    expect(loaded?.character.age).toBe(24);
    expect(loaded?.currentFocus).toBe('work');
  });

  it('clears active save on demand', () => {
    saveActiveGame(mockCharacter, 'health', false);
    expect(hasActiveSave()).toBe(true);

    clearActiveSave();
    expect(hasActiveSave()).toBe(false);
    expect(loadActiveGame()).toBeNull();
  });

  it('refuses to save a deceased character as an active resume save', () => {
    const deadChar = { ...mockCharacter, isAlive: false, deathAge: 24 };
    const saved = saveActiveGame(deadChar, 'health', false);
    expect(saved).toBe(false);
    expect(hasActiveSave()).toBe(false);
  });
});
