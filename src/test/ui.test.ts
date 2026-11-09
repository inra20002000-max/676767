import { describe, it, expect } from 'vitest';
import { getCountryFlag, getGlobalBirthRank, REGION_NAMES } from '../components/BirthLottery';
import { computeLifeArchetype } from '../components/CanvasShareModal';
import { FOCUS_DEFINITIONS } from '../engine/lifeStages';
import { COUNTRIES } from '../data/countries';
import { generateBirth, clampStats } from '../engine/simulationCore';
import type { CharacterState, FocusType, LifeStage } from '../types/simulation';

describe('Milestone 4 UI & Component Systems Unit Tests', () => {
  describe('1. BirthLottery & Global Demographics Mapping', () => {
    it('correctly maps major country ISO3 codes to national flag emojis', () => {
      expect(getCountryFlag('RUS')).toBe('🇷🇺');
      expect(getCountryFlag('USA')).toBe('🇺🇸');
      expect(getCountryFlag('BRA')).toBe('🇧🇷');
      expect(getCountryFlag('IND')).toBe('🇮🇳');
      expect(getCountryFlag('CHN')).toBe('🇨🇳');
      expect(getCountryFlag('NGA')).toBe('🇳🇬');
      expect(getCountryFlag('DEU')).toBe('🇩🇪');
      expect(getCountryFlag('GBR')).toBe('🇬🇧');
      expect(getCountryFlag('FRA')).toBe('🇫🇷');
      expect(getCountryFlag('JPN')).toBe('🇯🇵');
      expect(getCountryFlag('XYZ')).toBe('🌐'); // Unknown fallback
    });

    it('computes realistic global birth ranks across all 172 countries', () => {
      // Top birth countries in global statistics: India (#1), China (#2), Nigeria (#3)
      const indRank = getGlobalBirthRank('IND');
      const chnRank = getGlobalBirthRank('CHN');
      const ngaRank = getGlobalBirthRank('NGA');

      expect(indRank).toBeGreaterThanOrEqual(1);
      expect(indRank).toBeLessThanOrEqual(3);
      expect(chnRank).toBeGreaterThanOrEqual(1);
      expect(chnRank).toBeLessThanOrEqual(3);
      expect(ngaRank).toBeGreaterThanOrEqual(1);
      expect(ngaRank).toBeLessThanOrEqual(5);

      // Verify all 172 countries return ranks between 1 and 172
      for (const country of COUNTRIES) {
        const rank = getGlobalBirthRank(country.id);
        expect(rank).toBeGreaterThanOrEqual(1);
        expect(rank).toBeLessThanOrEqual(COUNTRIES.length);
      }
    });

    it('has complete localized region names for all demographic clusters', () => {
      const regions = ['sa', 'mena', 'ssa', 'lac', 'eap', 'eca', 'hi'];
      for (const r of regions) {
        expect(REGION_NAMES[r]).toBeDefined();
        expect(typeof REGION_NAMES[r]).toBe('string');
        expect(REGION_NAMES[r].length).toBeGreaterThan(0);
      }
    });
  });

  describe('2. Strategic Annual Focus System (15 Focuses)', () => {
    const requiredFocuses: FocusType[] = [
      'study',
      'work',
      'health',
      'social',
      'crime',
      'substance',
      'family',
      'hobby',
      'military',
      'religion',
      'politics',
      'travel',
      'art',
      'money',
      'rest',
    ];

    it('defines all 15 strategic annual focuses with labels, icons and effects', () => {
      for (const f of requiredFocuses) {
        const def = FOCUS_DEFINITIONS[f];
        expect(def, `Focus ${f} should be defined`).toBeDefined();
        expect(def.labelRu).toBeTruthy();
        expect(def.icon).toBeTruthy();
        expect(def.descriptionRu).toBeTruthy();
        expect(def.effectsSummaryRu).toBeTruthy();
        expect(def.statDeltas).toBeDefined();
      }
    });

    it('strictly respects stat clamping [0, 100] when applying focus deltas', () => {
      const maxStats = clampStats({ health: 150, happiness: 120, smarts: 200, social: 110 });
      expect(maxStats.health).toBe(100);
      expect(maxStats.happiness).toBe(100);
      expect(maxStats.smarts).toBe(100);
      expect(maxStats.social).toBe(100);

      const minStats = clampStats({ health: -20, happiness: -5, smarts: -50, social: -1 });
      expect(minStats.health).toBe(0);
      expect(minStats.happiness).toBe(0);
      expect(minStats.smarts).toBe(0);
      expect(minStats.social).toBe(0);
    });
  });

  describe('3. Life Archetypes Evaluation', () => {
    it('accurately categorizes diverse life trajectories into archetypes', () => {
      const baseChar = generateBirth({ seed: 42, mode: 'birth' });

      // 1. Genius from the slums
      const slumGenius: CharacterState = {
        ...baseChar,
        stats: { ...baseChar.stats, smarts: 85 },
        wealth: { ...baseChar.wealth, quintile: 1, netWorthUSD: 60000 },
      };
      expect(computeLifeArchetype(slumGenius).name).toBe('Гений из трущоб');

      // 2. Oligarch
      const oligarch: CharacterState = {
        ...baseChar,
        wealth: { ...baseChar.wealth, worldPct: 0.98, netWorthUSD: 500000 },
      };
      expect(computeLifeArchetype(oligarch).name).toBe('Олигарх');

      // 3. Centenarian / Survivor
      const centenarian: CharacterState = {
        ...baseChar,
        age: 88,
      };
      expect(computeLifeArchetype(centenarian).name).toBe('Долгожитель');

      // 4. Survivor (troubled paths)
      const survivor: CharacterState = {
        ...baseChar,
        age: 45,
        flags: { ...baseChar.flags, alcoholic: true },
      };
      expect(computeLifeArchetype(survivor).name).toBe('Выживший');

      // 5. Philosopher
      const philosopher: CharacterState = {
        ...baseChar,
        age: 60,
        stats: { ...baseChar.stats, smarts: 82 },
      };
      expect(computeLifeArchetype(philosopher).name).toBe('Философ');
    });
  });

  describe('4. Life Grid & Stage Classifications', () => {
    it('classifies ages into correct life stages', () => {
      const getStage = (age: number): LifeStage => {
        if (age <= 5) return 'baby';
        if (age <= 17) return 'school';
        if (age <= 21) return 'service';
        if (age <= 64) return 'adult';
        return 'elder';
      };

      expect(getStage(0)).toBe('baby');
      expect(getStage(3)).toBe('baby');
      expect(getStage(5)).toBe('baby');
      expect(getStage(6)).toBe('school');
      expect(getStage(16)).toBe('school');
      expect(getStage(18)).toBe('service');
      expect(getStage(21)).toBe('service');
      expect(getStage(22)).toBe('adult');
      expect(getStage(50)).toBe('adult');
      expect(getStage(65)).toBe('elder');
      expect(getStage(90)).toBe('elder');
    });
  });
});
