import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SoundEngine } from '../engine/soundEngine';

describe('SoundEngine Adversarial & Stress Suite', () => {
  let localStorageMock: Record<string, string> = {};
  let mockAudioContext: any;
  let mockSpeechSynthesis: any;
  let createdUtterances: any[] = [];
  let createdOscillators: any[] = [];
  let createdGains: any[] = [];

  const setupDefaultMocks = () => {
    localStorageMock = {};
    createdUtterances = [];
    createdOscillators = [];
    createdGains = [];

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
  };

  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // ==================== 1. RAPID MUTE/UNMUTE TOGGLING ====================
  describe('1. Rapid Mute/Unmute Toggling & Audio Graph Stability', () => {
    it('handles 1,000 rapid SFX mute/unmute toggles without memory or state corruption', () => {
      const engine = new SoundEngine();
      for (let i = 0; i < 1000; i++) {
        engine.toggleSfx();
      }
      expect(engine.isSfxMuted()).toBe(false);
      expect(localStorageMock['one8b_sfx_muted']).toBe('false');
    });

    it('interleaves rapid mute toggles with audio play requests safely', () => {
      const engine = new SoundEngine();
      expect(() => {
        for (let i = 0; i < 200; i++) {
          if (i % 2 === 0) {
            engine.toggleSfx();
          }
          engine.play('click');
          engine.play('step');
          engine.play('heartbeat');
          engine.play('milestone');
          engine.play('crisis');
          engine.play('death');
        }
      }).not.toThrow();
    });

    it('handles rapid voice mute toggling without unhandled cancel errors', () => {
      const engine = new SoundEngine();
      expect(() => {
        for (let i = 0; i < 100; i++) {
          engine.toggleVoice();
        }
      }).not.toThrow();
    });

    it('catches exceptions when window.speechSynthesis.cancel() throws during rapid mute toggle', () => {
      mockSpeechSynthesis.cancel = vi.fn(() => {
        throw new DOMException('Speech synthesis cancel failed', 'InvalidStateError');
      });

      const engine = new SoundEngine();
      // Calling toggleVoice when not muted will set it to muted, which calls window.speechSynthesis.cancel()
      expect(() => {
        engine.toggleVoice();
      }).not.toThrow();
    });

    it('catches exceptions when window.speechSynthesis.cancel() throws during setVoiceMuted(true)', () => {
      mockSpeechSynthesis.cancel = vi.fn(() => {
        throw new DOMException('Speech synthesis cancel failed', 'InvalidStateError');
      });

      const engine = new SoundEngine();
      expect(() => {
        engine.setVoiceMuted(true);
      }).not.toThrow();
    });
  });

  // ==================== 2. SUSPENDED AUDIOCONTEXT & PRE-GESTURE ====================
  describe('2. AudioContext Lifecycle & Pre-User Gesture Handling', () => {
    it('handles suspended AudioContext when resume() is rejected (autoplay policy block)', () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume = vi.fn().mockRejectedValue(
        new DOMException('The AudioContext was not allowed to start.', 'NotAllowedError')
      );

      const engine = new SoundEngine();
      expect(() => {
        engine.playClick();
        engine.playTick();
        engine.playHeartbeat();
        engine.playSuccess();
        engine.playWarning();
        engine.playGameOver();
      }).not.toThrow();
    });

    it('survives when AudioContext constructor throws (e.g. hardware limit or denied permission)', () => {
      vi.stubGlobal(
        'AudioContext',
        vi.fn(() => {
          throw new DOMException(
            'Failed to construct AudioContext: maximum number of contexts reached',
            'QuotaExceededError'
          );
        })
      );
      vi.stubGlobal('window', {
        localStorage: globalThis.localStorage,
        AudioContext: globalThis.AudioContext,
        speechSynthesis: mockSpeechSynthesis,
        SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance,
      });

      const engine = new SoundEngine();
      // initCtx is called directly or via play methods
      expect(() => engine.initCtx()).not.toThrow();
      expect(() => engine.unlock()).not.toThrow();
      expect(() => engine.playClick()).not.toThrow();
      expect(() => engine.play('milestone')).not.toThrow();
    });

    it('survives when AudioContext.currentTime is invalid or non-advancing', () => {
      mockAudioContext.currentTime = 0;
      const engine = new SoundEngine();
      expect(() => {
        for (let i = 0; i < 50; i++) {
          engine.playClick();
        }
      }).not.toThrow();
    });
  });

  // ==================== 3. SPEECH SYNTHESIS ABSENCE OR EXCEPTIONS ====================
  describe('3. Speech Synthesis Absence & Hostile Browser Environments', () => {
    it('constructs and operates safely when window.speechSynthesis is completely missing', () => {
      vi.stubGlobal('speechSynthesis', undefined);
      vi.stubGlobal('window', {
        localStorage: globalThis.localStorage,
        AudioContext: globalThis.AudioContext,
      });

      expect(() => {
        const engine = new SoundEngine();
        engine.speak('Тест');
        engine.toggleVoice();
        engine.setVoiceMuted(true);
        engine.unlock();
      }).not.toThrow();
    });

    it('constructs and operates safely when window.speechSynthesis is null (disabled webview)', () => {
      vi.stubGlobal('speechSynthesis', null);
      vi.stubGlobal('window', {
        localStorage: globalThis.localStorage,
        AudioContext: globalThis.AudioContext,
        speechSynthesis: null,
      });

      expect(() => {
        const engine = new SoundEngine();
        engine.speak('Тест');
        engine.toggleVoice();
        engine.setVoiceMuted(true);
        engine.unlock();
      }).not.toThrow();
    });

    it('constructs safely when window.speechSynthesis.getVoices throws an exception', () => {
      mockSpeechSynthesis.getVoices = vi.fn(() => {
        throw new Error('SecurityError: Speech synthesis denied');
      });

      expect(() => {
        const engine = new SoundEngine();
        engine.speak('Тест');
      }).not.toThrow();
    });

    it('constructs safely when onvoiceschanged assignment throws or fails', () => {
      Object.defineProperty(mockSpeechSynthesis, 'onvoiceschanged', {
        get: () => null,
        set: () => {
          throw new DOMException('Cannot set onvoiceschanged', 'SecurityError');
        },
      });

      expect(() => {
        new SoundEngine();
      }).not.toThrow();
    });

    it('handles speak() when window.speechSynthesis.speak throws an exception', () => {
      mockSpeechSynthesis.speak = vi.fn(() => {
        throw new DOMException('Speech service unavailable', 'NetworkError');
      });

      const engine = new SoundEngine();
      expect(() => {
        engine.speak('Сообщение');
        engine.speakBirth('Россия', 'Условия');
        engine.speakMilestone('Событие');
        engine.speakDeath('Эпитафия');
      }).not.toThrow();
    });
  });

  // ==================== 4. LONG STRING SPEECH SYNTHESIS & SAFEGUARDS ====================
  describe('4. Long String Speech Synthesis & Input Safeguards', () => {
    it('handles empty string and whitespace-only string safely without error', () => {
      const engine = new SoundEngine();
      expect(() => {
        engine.speak('');
        engine.speak('   ');
        engine.speak('\n\t\r');
      }).not.toThrow();
    });

    it('handles extremely long strings (10,000+ characters) without throwing or crashing', () => {
      const engine = new SoundEngine();
      const hugeText = 'А'.repeat(20000);

      expect(() => {
        engine.speak(hugeText);
        engine.speakBirth(hugeText, hugeText);
        engine.speakMilestone(hugeText);
        engine.speakDeath(hugeText);
      }).not.toThrow();
    });

    it('enforces string truncation / safeguard so browser utterance does not exceed safe length', () => {
      const engine = new SoundEngine();
      const longText = 'Статистический текст симуляции жизни. '.repeat(100); // ~3,700 characters
      createdUtterances = [];

      engine.speak(longText);

      expect(createdUtterances.length).toBe(1);
      const dispatchedText = createdUtterances[0].text;
      // In browsers, utterances over 500-1000 characters cause speech engine freeze (crbug.com/241838)
      // Verify whether the engine protects against unbounded long strings
      expect(dispatchedText.length).toBeLessThanOrEqual(1000);
    });
  });
});
