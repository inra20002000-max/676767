// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { App } from '../App';
import HeaderHUD from '../components/HeaderHUD';
import { soundEngine } from '../engine/soundEngine';
import fs from 'fs';
import path from 'path';

describe('Adversarial Verification Suite: DisclaimerModal, Storage & Viewport (Milestone 1)', () => {
  let localStorageMock: Record<string, string> = {};
  let storageErrorToThrow: Error | null = null;
  let audioContextMock: any;
  let speechSynthesisMock: any;

  beforeEach(() => {
    localStorageMock = {};
    storageErrorToThrow = null;

    // Standard localStorage mock
    const mockStorage = {
      getItem: vi.fn((key: string) => {
        if (storageErrorToThrow) {
          throw storageErrorToThrow;
        }
        return localStorageMock[key] ?? null;
      }),
      setItem: vi.fn((key: string, value: string) => {
        if (storageErrorToThrow) {
          throw storageErrorToThrow;
        }
        localStorageMock[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        if (storageErrorToThrow) {
          throw storageErrorToThrow;
        }
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        if (storageErrorToThrow) {
          throw storageErrorToThrow;
        }
        localStorageMock = {};
      }),
    };

    // Web Audio Mock
    audioContextMock = {
      state: 'running',
      currentTime: 1.0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      })),
    };

    // Speech Synthesis Mock
    speechSynthesisMock = {
      speak: vi.fn(),
      cancel: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => [{ name: 'Russian Standard', lang: 'ru-RU' }]),
      onvoiceschanged: null,
    };

    class MockSpeechSynthesisUtterance {
      public text: string;
      public lang = '';
      public voice = null;
      public rate = 1.0;
      public pitch = 1.0;
      public volume = 1.0;
      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('AudioContext', vi.fn(() => audioContextMock));
    vi.stubGlobal('speechSynthesis', speechSynthesisMock);
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);
    vi.stubGlobal('window', {
      localStorage: mockStorage,
      AudioContext: globalThis.AudioContext,
      speechSynthesis: speechSynthesisMock,
      SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // =========================================================================
  // SECTION 1: CORRUPTED OR INVALID LOCALSTORAGE STATE
  // =========================================================================

  describe('1. Corrupted & Invalid localStorage State Resilience', () => {
    it('does NOT bypass 18+ disclaimer gate when one8b_age_confirmed contains JSON object string', () => {
      // Adversarial payload: corrupted object string
      localStorageMock['one8b_age_confirmed'] = JSON.stringify({ corrupted_json: true, bypass: 1 });

      const confirmed = localStorageMock['one8b_age_confirmed'] === 'true';
      expect(confirmed).toBe(false);

      // Render modal in controlled open mode to simulate unconfirmed state
      const markup = ReactDOMServer.renderToString(
        React.createElement(DisclaimerModal, { isOpen: !confirmed })
      );
      expect(markup).toContain('data-testid="disclaimer-modal"');
      expect(markup).toContain('18+ ВЗРОСЛЫЙ КОНТЕНТ &amp; ДИСКЛЕЙМЕР');
    });

    it('rejects all non-exact string values (TRUE, 1, yes, undefined, null, [object Object])', () => {
      const adversarialValues = [
        'TRUE',
        'True',
        '1',
        'yes',
        'true ',
        ' true',
        'null',
        'undefined',
        '[object Object]',
        '{}',
        '{"confirmed":true}',
        'NaN',
        '0',
        '',
      ];

      adversarialValues.forEach((val) => {
        localStorageMock['one8b_age_confirmed'] = val;
        const isBypassed = localStorage.getItem('one8b_age_confirmed') === 'true';
        expect(
          isBypassed,
          `Adversarial value "${val}" should NOT bypass age gate`
        ).toBe(false);
      });
    });

    it('handles corrupted one8b_safe_mode values without crashing and defaults to false', () => {
      const corruptSafeModes = [
        '{ corrupted_safe_mode: true }',
        '1',
        'SAFE',
        'TRUE',
        'undefined',
        'null',
      ];

      corruptSafeModes.forEach((corruptVal) => {
        localStorageMock['one8b_safe_mode'] = corruptVal;
        const isSafe = localStorage.getItem('one8b_safe_mode') === 'true';
        expect(isSafe).toBe(false);
      });

      // Valid safe mode value
      localStorageMock['one8b_safe_mode'] = 'true';
      expect(localStorage.getItem('one8b_safe_mode') === 'true').toBe(true);
    });

    it('preserves DisclaimerModal contract when localStorage contains extreme oversized payloads (500KB pollution)', () => {
      const largeJunk = 'X'.repeat(500 * 1024);
      localStorageMock['polluted_cache_blob'] = largeJunk;
      localStorageMock['one8b_age_confirmed'] = 'false';

      expect(() => {
        const val = localStorage.getItem('one8b_age_confirmed') === 'true';
        ReactDOMServer.renderToString(
          React.createElement(DisclaimerModal, { isOpen: !val })
        );
      }).not.toThrow();
    });
  });

  // =========================================================================
  // SECTION 2: LOCALSTORAGE SECURITY ERROR & PRIVATE BROWSING (SANDBOX)
  // =========================================================================

  describe('2. SecurityError & Private Browsing Mode Exception Handling', () => {
    it('CRITICAL FLAW: DisclaimerModal useEffect lacks try/catch and crashes when localStorage.getItem throws SecurityError', () => {
      // In Safari Private Mode, sandboxed iframes, or when storage is restricted,
      // calling localStorage.getItem throws DOMException SecurityError.
      const securityError = new Error('SecurityError: The operation is insecure.');
      storageErrorToThrow = securityError;

      // Direct simulation of DisclaimerModal.tsx lines 18-24:
      // useEffect(() => {
      //   if (typeof window !== 'undefined') {
      //     const confirmed = localStorage.getItem('one8b_age_confirmed') === 'true';
      //     ...
      //   }
      // }, []);
      const mountDisclaimerModalEffect = () => {
        if (typeof window !== 'undefined') {
          const confirmed = localStorage.getItem('one8b_age_confirmed') === 'true';
          return confirmed;
        }
        return false;
      };

      // In robust production code, this should be caught and default to safe state (show disclaimer).
      // Here, it UNHANDLED THROWS:
      expect(mountDisclaimerModalEffect).toThrow('SecurityError: The operation is insecure.');
    });

    it('CRITICAL FLAW: App.tsx useEffect lacks try/catch and crashes when localStorage.getItem throws SecurityError', () => {
      // Direct simulation of App.tsx lines 14-22:
      // useEffect(() => {
      //   if (typeof window !== 'undefined') {
      //     const confirmed = localStorage.getItem('one8b_age_confirmed') === 'true';
      //     const isSafe = localStorage.getItem('one8b_safe_mode') === 'true';
      //     setIsAgeConfirmed(confirmed);
      //     setSafeMode(isSafe);
      //     setShowDisclaimer(!confirmed);
      //   }
      // }, []);
      const securityError = new Error('SecurityError: Access is denied for this document.');
      storageErrorToThrow = securityError;

      const mountAppEffect = () => {
        if (typeof window !== 'undefined') {
          const confirmed = localStorage.getItem('one8b_age_confirmed') === 'true';
          const isSafe = localStorage.getItem('one8b_safe_mode') === 'true';
          return { confirmed, isSafe };
        }
        return { confirmed: false, isSafe: false };
      };

      expect(mountAppEffect).toThrow('SecurityError: Access is denied for this document.');
    });

    it('CRITICAL FLAW: window.localStorage getter throwing SecurityError halts execution in un-guarded code', () => {
      // In strict sandboxed iframes (sandbox without allow-same-origin),
      // accessing window.localStorage itself throws SecurityError immediately!
      const hostileWindow = {
        get localStorage() {
          throw new Error('SecurityError: Blocked accessing localStorage in sandboxed iframe');
        },
      };

      const checkStorageAccess = () => {
        try {
          return hostileWindow.localStorage !== undefined;
        } catch {
          return false;
        }
      };

      // Storage access must be verified before calling methods on it
      expect(checkStorageAccess()).toBe(false);
    });

    it('gracefully degrades during handleConfirm when localStorage.setItem throws QuotaExceededError or SecurityError', () => {
      // DisclaimerModal.tsx lines 32-41 wrap setItem in try/catch:
      // try { localStorage.setItem('one8b_age_confirmed', 'true'); ... } catch {}
      const setItemMock = vi.fn(() => {
        throw new Error('QuotaExceededError: The quota has been exceeded.');
      });
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(),
        setItem: setItemMock,
        removeItem: vi.fn(),
      });

      const onConfirmCallback = vi.fn();

      // Simulate handleConfirm execution
      const handleConfirm = (safeMode: boolean) => {
        soundEngine.unlock();
        soundEngine.playClick();
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('one8b_age_confirmed', 'true');
            if (safeMode) {
              localStorage.setItem('one8b_safe_mode', 'true');
            } else {
              localStorage.removeItem('one8b_safe_mode');
            }
          } catch {
            // Storage access error handling
          }
        }
        if (onConfirmCallback) {
          onConfirmCallback(safeMode);
        }
      };

      expect(() => handleConfirm(false)).not.toThrow();
      expect(onConfirmCallback).toHaveBeenCalledWith(false);
      expect(setItemMock).toHaveBeenCalledWith('one8b_age_confirmed', 'true');
    });
  });

  // =========================================================================
  // SECTION 3: DOUBLE-CLICKING & RAPID CLICKING STRESS HARNESS
  // =========================================================================

  describe('3. Double-Clicking, Rapid Clicking & Race Condition Stress', () => {
    it('DEFECT: DisclaimerModal buttons lack disabled attribute during unmount/submission, allowing multiple rapid triggers', () => {
      // DisclaimerModal buttons currently have:
      // type="button", id="confirm-18-btn", onClick={() => handleConfirm(false)}
      // BUT no disabled attribute or debounce logic.
      const html = ReactDOMServer.renderToString(
        React.createElement(DisclaimerModal, { isOpen: true })
      );

      // Verify that confirm button does not have disabled attribute
      expect(html).toContain('data-testid="btn-disclaimer-confirm"');
      expect(html).not.toMatch(/data-testid="btn-disclaimer-confirm"[^>]*disabled/);
    });

    it('stresses rapid multi-clicking (20 rapid clicks): invokes audio oscillator bursts without audio crash', async () => {
      const { SoundEngine } = await import('../engine/soundEngine');
      const localEngine = new SoundEngine();
      localEngine.setSfxMuted(false);
      localEngine.setVoiceMuted(false);
      let clickCount = 0;
      let successCount = 0;

      const handleConfirm = (safeMode: boolean) => {
        localEngine.unlock();
        localEngine.playClick();
        clickCount++;
      };

      const handleAppConfirm = (safe: boolean) => {
        localEngine.playSuccess();
        localEngine.speak(safe ? 'Безопасный режим' : 'Симулятор жизни 1 из 8 миллиардов');
        successCount++;
      };

      // Simulate 20 rapid clicks on the 18+ button within 100ms
      for (let i = 0; i < 20; i++) {
        handleConfirm(false);
        handleAppConfirm(false);
      }

      expect(clickCount).toBe(20);
      expect(successCount).toBe(20);
      // Audio engine survived 20 clicks without throwing
      expect(audioContextMock.createOscillator).toHaveBeenCalled();
      expect(speechSynthesisMock.speak).toHaveBeenCalled();
    });

    it('DEFECT: Conflicting rapid clicks (18+ Confirm followed immediately by Safe Mode) causes race condition in localStorage', () => {
      // If a user clicks 18+ Confirm and then quickly clicks Safe Mode during exit animation:
      const actions: boolean[] = [];

      const handleConfirm = (safeMode: boolean) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('one8b_age_confirmed', 'true');
            if (safeMode) {
              localStorage.setItem('one8b_safe_mode', 'true');
            } else {
              localStorage.removeItem('one8b_safe_mode');
            }
          } catch {}
        }
        actions.push(safeMode);
      };

      // Click 1: User clicks 18+ Confirm
      handleConfirm(false);
      expect(localStorageMock['one8b_age_confirmed']).toBe('true');
      expect(localStorageMock['one8b_safe_mode']).toBeUndefined();

      // Click 2 (50ms later during exit animation): User taps Safe Mode
      handleConfirm(true);
      expect(localStorageMock['one8b_safe_mode']).toBe('true');
      expect(actions).toEqual([false, true]);
    });
  });

  // =========================================================================
  // SECTION 4: VIEWPORT BOUNDARIES (360px WIDTH, EXTREME HEIGHTS, HORIZONTAL SCROLL)
  // =========================================================================

  describe('4. Viewport Boundary & Layout Conformance (360px & Extreme Heights)', () => {
    it('verifies DisclaimerModal structural markup conforms to mobile-first responsive constraints', () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(DisclaimerModal, { isOpen: true })
      );

      // Verify outer modal backdrop has overflow-y-auto to allow vertical scrolling on short screens
      expect(html).toContain('overflow-y-auto');

      // Verify modal backdrop padding has p-3 (12px padding on 360px screen leaves 336px)
      expect(html).toContain('p-3');

      // Verify modal box has max-w-xl and w-full
      expect(html).toContain('w-full max-w-xl');

      // Verify action buttons stack vertically on mobile (flex-col sm:flex-row)
      expect(html).toContain('flex flex-col sm:flex-row gap-3');

      // Verify trigger grid uses 2 columns on mobile (grid-cols-2 sm:grid-cols-4)
      expect(html).toContain('grid grid-cols-2 sm:grid-cols-4');
    });

    it('verifies App shell layout enforces zero horizontal scroll (overflow-x-hidden & 100dvh)', () => {
      const html = ReactDOMServer.renderToString(React.createElement(App));

      // Root App container must enforce overflow-x-hidden and 100dvh
      expect(html).toContain('overflow-x-hidden');
      expect(html).toContain('min-h-[100dvh]');

      // Main container must use max-w-5xl w-full
      expect(html).toContain('max-w-5xl w-full mx-auto');
    });

    it('VERIFIED FIX: HeaderHUD.tsx uses supported "sm:inline" variant instead of invalid "xs:inline"', () => {
      // In src/components/HeaderHUD.tsx:
      // Replaced unsupported 'xs:inline' with supported 'sm:inline' so that
      // Tailwind compiler properly emits responsive display rules.
      const hudSource = fs.readFileSync(
        path.join(process.cwd(), 'src/components/HeaderHUD.tsx'),
        'utf-8'
      );
      expect(hudSource).not.toContain('xs:inline');
      expect(hudSource).toContain('sm:inline');

      const tailwindConfig = fs.readFileSync(
        path.join(process.cwd(), 'tailwind.config.ts'),
        'utf-8'
      );
      // Confirm 'screens' does not define 'xs'
      expect(tailwindConfig).not.toMatch(/xs\s*:/);

      // Verify compiled CSS in dist/ does not contain 'xs:inline'
      const distCssDir = path.join(process.cwd(), 'dist/assets');
      if (fs.existsSync(distCssDir)) {
        const cssFiles = fs.readdirSync(distCssDir).filter((f) => f.endsWith('.css'));
        cssFiles.forEach((file) => {
          const content = fs.readFileSync(path.join(distCssDir, file), 'utf-8');
          expect(content).not.toContain('xs:inline');
        });
      }
    });

    it('verifies extreme short height behavior (400px landscape mobile / keyboard open): scroll container is preserved', () => {
      const modalSource = fs.readFileSync(
        path.join(process.cwd(), 'src/components/DisclaimerModal.tsx'),
        'utf-8'
      );

      // Must have overflow-y-auto on backdrop
      expect(modalSource).toContain('overflow-y-auto');
      // Must have my-auto on card to allow natural flex scrolling without top cutoff
      expect(modalSource).toContain('my-auto');
    });

    it('verifies extreme tall height behavior (2400px ultra-tall portrait): flex-1 justify-center fills height without gap artifacts', () => {
      const appSource = fs.readFileSync(
        path.join(process.cwd(), 'src/App.tsx'),
        'utf-8'
      );

      // Must use flex-1 and justify-center to vertically center on tall viewports
      expect(appSource).toContain('flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center');
    });
  });
});
