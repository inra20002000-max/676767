# TEST_READY.md: Automated Test Infrastructure & Verification Suite

**Project**: Life Simulator (1in8b Reimagined for Gen Z & Gen Alpha)  
**Track**: E2E & Unit Test Infrastructure  
**Author**: `test_writer_e2e`  
**Date**: 2026-11-09  
**Status**: ACTIVE & VERIFIED (Milestone 1 Baseline Operational)  

---

## 1. Test Harness Overview & Execution Commands

The automated verification infrastructure consists of dual complementary testing tiers designed to run natively on Windows 11 using Node.js 24:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COMPREHENSIVE TEST HARNESS                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│   LAYER 1: VITEST UNIT & CONTRACT │ │ LAYER 2: PLAYWRIGHT HEADLESS E2E │
│  - SoundEngine SFX synthesis      │ │  - 4 Viewport Layout Invariants  │
│  - Web Speech API Russian voice   │ │  - Zero Horizontal Overflow      │
│  - Independent mute toggles       │ │  - 18+ Disclaimer Gate Flow      │
│  - LocalStorage state persistence │ │  - Safe Mode (12+) toggle check  │
│  - 20 unit tests, 100% pass       │ │  - Strict 0 Console Error Trap   │
└───────────────────────────────────┘ └──────────────────────────────────┘
```

### Execution Commands (Windows 11 Standard)
```powershell
# 1. Run Vitest Unit Tests
npm.cmd test

# 2. Run Headless Browser E2E Verification Runner
npm.cmd run test:e2e
# (or directly: node scripts/verify-browser.js)

# 3. Run Both Unit and E2E Suites
npm.cmd run test:all
```

---

## 2. Browser Verification Runner (`scripts/verify-browser.js`)

The automated browser runner (`scripts/verify-browser.js`) is resilient against server state, automatically launches Vite preview on port 4173 (or uses `TEST_URL` / active dev ports), launches Chromium/Chrome/Edge headless, and performs strict invariant verification.

### Key Verification Checks:
1. **18+ Disclaimer Gate Flow (`TC-T1-01`)**:
   - Detects fresh visitor state, asserts `[data-testid="disclaimer-modal"]` blocks entry on first visit.
   - Verifies age warning text, trigger categories (tobacco, alcohol, psychoactive substances, violence/blood, pediatric mortality), and UN WPP / WHO GHE educational non-advocacy clause.
   - Simulates click on `[data-testid="btn-disclaimer-confirm"]` / `#confirm-18-btn`.
   - Asserts modal dismisses, unblocks UI, and persists consent to `localStorage.getItem('one8b_age_confirmed') === 'true'`.
   - Reloads page and asserts disclaimer modal does not reappear.
2. **Safe Mode (12+) Filter (`TC-T3-05`)**:
   - Asserts `[data-testid="btn-disclaimer-safe"]` is present and functional.
   - Verifies consent persistence in `localStorage.getItem('one8b_safe_mode') === 'true'`.
3. **Multi-Viewport Responsive Ergonomics**:
   - **`mobile-se`** (375x667, mobile touch emulation): Verified 0 overflow.
   - **`mobile-modern`** (390x844, modern iPhone/Android): Verified 0 overflow.
   - **`desktop-standard`** (1440x900, standard laptop): Verified 0 overflow.
   - **`desktop-fhd`** (1920x1080, full HD monitor): Verified 0 overflow.
4. **Layout Invariant: Zero Horizontal Overflow**:
   - Programmatically asserts `scrollWidth <= clientWidth` on both `document.documentElement` and `document.body` across all 4 viewports.
5. **HUD Audio & Voice Controls Verification**:
   - SFX Toggle: exercises `[data-testid="btn-sound-toggle"]`, asserts localStorage updates.
   - Voice Toggle: exercises `[data-testid="btn-voice-toggle"]`, asserts localStorage updates.
6. **Interaction Stress**:
   - Executes 20 rapid audio clicks within 1 second; asserts zero memory leak, audio context crash, or unhandled promise rejection.
7. **Strict Console Error Interception**:
   - Listens to `page.on('console')` and `page.on('pageerror')`.
   - Hard failure triggered if any runtime error or unhandled rejection occurs.

---

## 3. Unit Test Suite (`src/test/soundEngine.test.ts`)

20 comprehensive unit tests covering:
- **Default State**: Initializing unmuted when localStorage is clean.
- **State Restoration**: Restoring independent SFX and Voice mute states from `localStorage`.
- **Legacy Migration**: Migrating legacy `one8b_muted` to `one8b_sfx_muted`.
- **Sandboxing Resiliency**: Graceful fallback when `localStorage` throws `SecurityError`.
- **SFX Toggle**: Inverting state, persisting to `one8b_sfx_muted` and `one8b_muted`.
- **Voice Toggle**: Inverting state, persisting to `one8b_voice_muted`, canceling speech on mute.
- **Speech Synthesis**: Creating Russian utterance (`ru-RU`), voice selection, text dispatch.
- **Specialized Speech**: Formatting `speakBirth()`, `speakMilestone()`, and `speakDeath()`.
- **AudioContext Lifecycle**: Handling suspended audio contexts, unlocking on user gesture.
- **Web Audio Nodes**: Verifying oscillator scheduling, frequency curves, and gain ramps.
- **Mute Suppression**: Ensuring zero audio nodes or speech utterances dispatched when muted.
- **Contract Mapping**: Full verification of all sound events (`click`, `step`, `heartbeat`, `milestone`, `crisis`, `death`).
- **Rapid Stress**: 50 consecutive toggles maintaining perfect synchronization.

---

## 4. Current Test Results

| Suite | Runner | Test Count | Pass / Fail | Duration |
|---|---|---|---|---|
| `soundEngine.test.ts` | Vitest | 20 | 20 PASS / 0 FAIL | 28ms |
| `verify-browser.js` | Playwright (Headless) | 7 Suites / 4 Viewports | PASS (0 errors) | ~11s |
| Production Build | `tsc && vite build` | 1935 modules | 0 errors | 5.6s |

---

## 5. Implementation Bug Escalations

During adversarial test execution, the following 6 edge-case defects in `src/engine/soundEngine.ts` were discovered and escalated to the Milestone 1 implementing agent (`worker_m1`) for resolution:
1. `SoundEngine.toggleVoice()` and `setVoiceMuted()`: Missing `try/catch` around `window.speechSynthesis.cancel()`.
2. `SoundEngine.initCtx()`: Missing `try/catch` around `new AudioCtx()`.
3. `SoundEngine.initVoiceEngine()`: Throws `TypeError` if `window.speechSynthesis` is `null`.
4. `SoundEngine.initVoiceEngine()`: Uncaught `SecurityError` if `onvoiceschanged` property assignment is restricted.
5. `SoundEngine.speak(text)`: Missing text length truncation (>1000 chars) to prevent browser speech buffer exhaustion.
