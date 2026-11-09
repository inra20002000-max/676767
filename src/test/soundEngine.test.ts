import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SoundEngine, SoundEvent } from '../engine/soundEngine';

describe('SoundEngine Unit Test Suite', () => {
  let localStorageMock: Record<string, string> = {};
  let mockAudioContext: any;
  let mockSpeechSynthesis: any;
  let createdUtterances: any[] = [];
  let createdOscillators: any[] = [];
  let createdGains: any[] = [];

  beforeEach(() => {
    localStorageMock = {};
    createdUtterances = [];
    createdOscillators = [];
    createdGains = [];

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = String(value);
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
    });

    // Mock AudioContext and Web Audio Nodes
    mockAudioContext = {
      state: 'running',
      currentTime: 10.0,
      destination: { connect: vi.fn() },
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => {
        const osc = {
          type: 'sine',
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        createdOscillators.push(osc);
        return osc;
      }),
      createGain: vi.fn(() => {
        const gain = {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
        createdGains.push(gain);
        return gain;
      }),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
    };

    vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));

    // Mock Web Speech API
    mockSpeechSynthesis = {
      speak: vi.fn((utterance: any) => {
        createdUtterances.push(utterance);
      }),
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => [
        { name: 'Russian Standard', lang: 'ru-RU' },
        { name: 'English Standard', lang: 'en-US' },
      ]),
      onvoiceschanged: null,
    };

    class MockSpeechSynthesisUtterance {
      public text: string;
      public lang: string = '';
      public voice: any = null;
      public rate: number = 1.0;
      public pitch: number = 1.0;
      public volume: number = 1.0;
      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);
    vi.stubGlobal('window', {
      localStorage: globalThis.localStorage,
      AudioContext: globalThis.AudioContext,
      speechSynthesis: mockSpeechSynthesis,
      SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // ==================== SECTION 1: INITIAL STATE & MIGRATION ====================

  describe('Initialization & State Recovery', () => {
    it('initializes with default unmuted state when localStorage is clean', () => {
      const engine = new SoundEngine();
      expect(engine.isSfxMuted()).toBe(false);
      expect(engine.isVoiceMuted()).toBe(false);
      expect(engine.getMuted()).toBe(false);
      expect(engine.isMuted()).toBe(false);
    });

    it('restores independent SFX and Voice mute state from localStorage', () => {
      localStorageMock['one8b_sfx_muted'] = 'true';
      localStorageMock['one8b_voice_muted'] = 'true';

      const engine = new SoundEngine();
      expect(engine.isSfxMuted()).toBe(true);
      expect(engine.isVoiceMuted()).toBe(true);
      expect(engine.getMuted()).toBe(true);
    });

    it('supports backward-compatible migration from legacy one8b_muted', () => {
      localStorageMock['one8b_muted'] = 'true';
      // one8b_sfx_muted is not present
      const engine = new SoundEngine();
      expect(engine.isSfxMuted()).toBe(true);
      expect(engine.isVoiceMuted()).toBe(false);
    });

    it('handles localStorage throwing errors gracefully in sandboxed environments', () => {
      vi.stubGlobal('localStorage', {
        getItem: () => {
          throw new Error('SecurityError: Access denied');
        },
        setItem: () => {
          throw new Error('SecurityError: Access denied');
        },
      });

      expect(() => new SoundEngine()).not.toThrow();
      const engine = new SoundEngine();
      expect(engine.isSfxMuted()).toBe(false);
      expect(engine.isVoiceMuted()).toBe(false);
    });
  });

  // ==================== SECTION 2: SFX MUTE & TOGGLE ====================

  describe('SFX Mute Controls & Persistence', () => {
    it('toggles SFX mute state and persists to both one8b_sfx_muted and legacy one8b_muted', () => {
      const engine = new SoundEngine();
      expect(engine.isSfxMuted()).toBe(false);

      const firstToggle = engine.toggleSfx();
      expect(firstToggle).toBe(true);
      expect(engine.isSfxMuted()).toBe(true);
      expect(localStorageMock['one8b_sfx_muted']).toBe('true');
      expect(localStorageMock['one8b_muted']).toBe('true');

      const secondToggle = engine.toggleSfx();
      expect(secondToggle).toBe(false);
      expect(engine.isSfxMuted()).toBe(false);
      expect(localStorageMock['one8b_sfx_muted']).toBe('false');
      expect(localStorageMock['one8b_muted']).toBe('false');
    });

    it('allows explicitly setting SFX mute state via setSfxMuted', () => {
      const engine = new SoundEngine();
      engine.setSfxMuted(true);
      expect(engine.isSfxMuted()).toBe(true);
      expect(localStorageMock['one8b_sfx_muted']).toBe('true');

      engine.setSfxMuted(false);
      expect(engine.isSfxMuted()).toBe(false);
      expect(localStorageMock['one8b_sfx_muted']).toBe('false');
    });

    it('supports legacy toggleMute, getMuted, isMuted, and setMuted aliases', () => {
      const engine = new SoundEngine();
      expect(engine.getMuted()).toBe(false);
      expect(engine.isMuted()).toBe(false);

      const result = engine.toggleMute();
      expect(result).toBe(true);
      expect(engine.getMuted()).toBe(true);
      expect(engine.isMuted()).toBe(true);

      engine.setMuted(false);
      expect(engine.getMuted()).toBe(false);
      expect(engine.isMuted()).toBe(false);
    });

    it('survives rapid volume mute stress (50 toggles in rapid sequence)', () => {
      const engine = new SoundEngine();
      let expected = false;
      for (let i = 0; i < 50; i++) {
        expected = !expected;
        const current = engine.toggleSfx();
        expect(current).toBe(expected);
      }
      expect(engine.isSfxMuted()).toBe(false);
      expect(localStorageMock['one8b_sfx_muted']).toBe('false');
    });
  });

  // ==================== SECTION 3: VOICE MUTE & SYNTHESIS ====================

  describe('Voice Narration Controls & Web Speech API Integration', () => {
    it('toggles Voice mute state and persists to one8b_voice_muted', () => {
      const engine = new SoundEngine();
      expect(engine.isVoiceMuted()).toBe(false);

      const toggled = engine.toggleVoice();
      expect(toggled).toBe(true);
      expect(engine.isVoiceMuted()).toBe(true);
      expect(localStorageMock['one8b_voice_muted']).toBe('true');
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();

      const toggledBack = engine.toggleVoice();
      expect(toggledBack).toBe(false);
      expect(engine.isVoiceMuted()).toBe(false);
      expect(localStorageMock['one8b_voice_muted']).toBe('false');
    });

    it('allows explicitly setting Voice mute state via setVoiceMuted', () => {
      const engine = new SoundEngine();
      engine.setVoiceMuted(true);
      expect(engine.isVoiceMuted()).toBe(true);
      expect(localStorageMock['one8b_voice_muted']).toBe('true');
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();

      engine.setVoiceMuted(false);
      expect(engine.isVoiceMuted()).toBe(false);
      expect(localStorageMock['one8b_voice_muted']).toBe('false');
    });

    it('dispatches Russian speech utterance when voice is active', () => {
      const engine = new SoundEngine();
      engine.speak('Тестовое оповещение');

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(createdUtterances.length).toBe(1);
      expect(createdUtterances[0].text).toBe('Тестовое оповещение');
      expect(createdUtterances[0].lang).toBe('ru-RU');
      expect(createdUtterances[0].voice?.name).toBe('Russian Standard');
    });

    it('does NOT dispatch speech synthesis when voice is muted', () => {
      const engine = new SoundEngine();
      engine.setVoiceMuted(true);
      mockSpeechSynthesis.speak.mockClear();

      engine.speak('Игнорируемое сообщение');
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('formats specialized speech methods correctly (speakBirth, speakMilestone, speakDeath)', () => {
      const engine = new SoundEngine();

      engine.speakBirth('Бразилия', 'Ожидаемая продолжительность жизни: 76 лет');
      expect(createdUtterances[createdUtterances.length - 1].text).toContain('Новая жизнь. Рождение в стране Бразилия.');

      engine.speakMilestone('Поступление в университет');
      expect(createdUtterances[createdUtterances.length - 1].text).toBe('Важное событие. Поступление в университет');

      engine.speakDeath('Прожил 84 года в окружении семьи');
      expect(createdUtterances[createdUtterances.length - 1].text).toContain('Жизненный путь завершен.');
    });
  });

  // ==================== SECTION 4: WEB AUDIO PROCEDURAL SFX ====================

  describe('Web Audio Procedural SFX & Event Dispatch', () => {
    it('initializes and resumes suspended AudioContext', () => {
      mockAudioContext.state = 'suspended';
      const engine = new SoundEngine();
      const ctx = engine.initCtx();

      expect(ctx).toBe(mockAudioContext);
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('unlocks audio context and speech synthesis on user interaction', () => {
      const engine = new SoundEngine();
      engine.unlock();

      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });

    it('dispatches oscillators and ramps gain nodes for unmuted SFX', () => {
      const engine = new SoundEngine();
      createdOscillators = [];
      createdGains = [];

      engine.playClick();
      expect(createdOscillators.length).toBeGreaterThan(0);
      expect(createdGains.length).toBeGreaterThan(0);
      expect(createdOscillators[0].start).toHaveBeenCalled();
      expect(createdOscillators[0].stop).toHaveBeenCalled();
    });

    it('suppresses audio synthesis when SFX is muted', () => {
      const engine = new SoundEngine();
      engine.setSfxMuted(true);
      createdOscillators = [];

      engine.playClick();
      engine.playTick();
      engine.playHeartbeat();
      engine.playSuccess();
      engine.playWarning();
      engine.playGameOver();

      expect(createdOscillators.length).toBe(0);
    });

    it('correctly maps all contract events in play(event)', () => {
      const engine = new SoundEngine();
      const events: SoundEvent[] = ['click', 'step', 'heartbeat', 'milestone', 'crisis', 'death'];

      events.forEach((evt) => {
        createdOscillators = [];
        engine.play(evt);
        expect(createdOscillators.length).toBeGreaterThan(0);
      });
    });

    it('falls back to click for unrecognized events without throwing', () => {
      const engine = new SoundEngine();
      createdOscillators = [];
      expect(() => engine.play('unknown_event' as any)).not.toThrow();
      expect(createdOscillators.length).toBeGreaterThan(0);
    });

    it('catches and isolates Web Audio policy or node creation errors', () => {
      mockAudioContext.createOscillator = vi.fn(() => {
        throw new Error('NotAllowedError: AudioContext was not allowed to start');
      });

      const engine = new SoundEngine();
      expect(() => engine.playClick()).not.toThrow();
      expect(() => engine.playSuccess()).not.toThrow();
      expect(() => engine.playWarning()).not.toThrow();
      expect(() => engine.playGameOver()).not.toThrow();
    });
  });
});
