# TEST_INFRA.md: Test Infrastructure & Verification Architecture
**Project**: Life Simulation Web Application (1in8b Reimagined for Gen Z & Gen Alpha)  
**Author**: Orchestrator (based on explorer_e2e_architect specification)  
**Status**: Authoritative Architecture Specification  
**Integrity Mode**: Production / Development  

---

## 1. Executive Summary & Testing Philosophy

The test infrastructure is designed on an **opaque-box, requirement-driven verification model**. Tests validate user-visible behaviors, statistical accuracy, responsive ergonomics, audio-visual feedback, and mathematical invariants without binding tightly to internal component implementation details.

### Core Testing Principles
1. **Requirement Traceability**: Every test case directly verifies an acceptance criterion from `ORIGINAL_REQUEST.md`, including user clarifications (100% 1in8b data fidelity, modern Gen Z/Alpha UI, 18+ disclaimer gate, canvas social recap).
2. **Deterministic PRNG Seeding**: The simulation engine supports deterministic seed injection (`?seed=<string>` or engine seed parameter), allowing reproducible test fixtures for rare events (infant mortality, supercentenarians, specific dilemmas, war hazards).
3. **Zero-Mock Simulation Runs**: E2E test runs execute against the genuine client-side demographic dataset (173 countries, Gompertz-Makeham mortality calibration, log-normal income CDFs, 21-33 cause matrix) to guarantee real-world fidelity.
4. **Zero-Tolerance Console Sanitation**: Any unhandled exception, syntax warning, audio context violation, or `console.error` immediately fails the test runner.
5. **Multi-Viewport Ergonomic Guarantees**: Dual automated verification across mobile (375px & 390px) and desktop (1440px & 1920px) viewports, enforcing touch-target standards and zero horizontal overflow.

---

## 2. Test Harness Architecture & Tooling Stack

The test harness consists of two complementary layers running in Node.js 24 on Windows 11:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COMPREHENSIVE TEST HARNESS                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│   LAYER 1: VITEST MATH & ENGINE   │ │ LAYER 2: HEADLESS BROWSER E2E    │
│  - PRNG determinism & uniformness │ │  - Playwright / Puppeteer script │
│  - 173-country demographic schema │ │  - Mobile (375px) & Desktop      │
│  - Monte Carlo birth distribution │ │  - DOM interactivity & speed     │
│  - Gompertz-Makeham bisection     │ │  - 18+ Disclaimer Gate flow      │
│  - Log-normal Gini income model   │ │  - Canvas 9:16 & 1:1 card export │
│  - Cause of death hazard weights  │ │  - Zero console errors assertion │
│  - Functional reducer purity      │ │  - 100-life batch cohort stress  │
└───────────────────────────────────┘ └──────────────────────────────────┘
```

### 2.1 Dependencies Configuration (`package.json`)
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "node scripts/verify-browser.js",
    "test:all": "npm.cmd run test && npm.cmd run test:e2e"
  },
  "devDependencies": {
    "vitest": "^2.1.4",
    "playwright": "^1.49.0"
  }
}
```

*Windows 11 Execution Standard*: Due to PowerShell script execution policies, all CLI commands must invoke `npm.cmd` and `npx.cmd` or run via `cmd /c`.

---

## 3. The 4-Tier E2E Testing Specification Matrix

### Tier 1: Feature Coverage (Core User Journeys & Smoke Verification)

| Test ID | Test Scenario | Requirement Mapping | Test Steps & Invariants | Expected Result |
|---|---|---|---|---|
| **TC-T1-01** | **18+ Disclaimer Gate Flow** | R2, Clarification 2026-11-08T22:00:44Z | 1. Clear `localStorage`.<br>2. Navigate to root `/`.<br>3. Verify modal `data-testid="disclaimer-modal"` is visible.<br>4. Verify presence of statistical advisory copy and educational non-advocacy clause.<br>5. Click `[ ПОДТВЕРЖДАЮ (18+) И НАЧАТЬ 🚀 ]`.<br>6. Check `localStorage.getItem('one8b_age_confirmed') === 'true'`.<br>7. Reload page. | Modal blocks simulation on first visit. Clicking confirm unblocks app and unlocks audio. Modal does not re-appear upon page refresh. |
| **TC-T1-02** | **Birth Lottery & Origin Reveal** | R1, Acceptance Criteria | 1. Advance past 18+ gate.<br>2. On `#intro`, click `[ РОДИТЬСЯ НА СВЕТ 🚀 ]`.<br>3. Verify transition to `#roll` screen.<br>4. Verify country card displays: Country Name, Flag Emoji, Life Expectancy (`le`), Infant Mortality (`im`), GDP PPP (`ppp`).<br>5. Verify character initialization: Age = 0, Sex in {'M', 'F'}, Name string non-empty, Wealth Quintile in [1, 5]. | Character spawns with consistent demographic stats matching country data table. |
| **TC-T1-03** | **Age Progression (Turn-Based & Turbo)** | R1, R2, Clarification 2026-11-08T21:58:21Z | 1. On `#life` screen, click `[ +1 Год ]`.<br>2. Assert age increments from 0 to 1 in <16ms.<br>3. Verify odometer display updates to "1".<br>4. Toggle "Turbo Mode" (0.3s/yr).<br>5. Observe continuous age progression until a decision dilemma card is encountered. | Turn-based click gives instant responsive increment. Turbo mode progresses rapidly and automatically halts on decision cards. |
| **TC-T1-04** | **Character Stat Management & Clamping** | R1, Acceptance Criteria | 1. Monitor stats (Health `hl`, Happiness `h`, Smarts `sm`, Social `so`) across 30 years.<br>2. Apply maximum positive bonus events (`+50`) and severe debuff events (`-80`).<br>3. Assert every stat value in [0, 100] at all times.<br>4. Verify Income and Net Worth calculations are strictly positive numbers. | Stats never overflow above 100 or drop below 0. No `NaN` or `undefined` values appear in UI. |
| **TC-T1-05** | **Interactive Decision Cards** | R1, R2, 101 `DEC` Trees | 1. Fast-forward to milestone age (e.g. 6 = primary school, 18 = career/college, 24 = marriage).<br>2. Assert modal `data-testid="decision-modal"` appears.<br>3. Verify Option A and Option B have explicit consequence badges (`+15 🎓`, `-10 💰`, `⚠️ Риск`).<br>4. Select Option A.<br>5. Assert state updates matching Option A delta, decision logged in chronicle, modal closes. | Decision cards render with clear Gen Z trade-off badges; choice application correctly mutates character trajectory. |
| **TC-T1-06** | **Death Screen & Memorial Recap** | R1, Acceptance Criteria | 1. Advance character until mortality trigger occurs or age reaches terminal limit.<br>2. Verify immediate transition to `#dead` screen.<br>3. Verify presence of: Age at death, Cause of death, Localized eulogy, Global Longevity Percentile, 10x10 Life Grid.<br>4. Verify dynamic Archetype Badge (e.g. "Техно-магнат", "Неуязвимый Выживший"). | Clean transition to memorial view with coherent retrospective metrics and respectful narrative. |
| **TC-T1-07** | **HTML5 Canvas Card Export** | R2, Clarification 2026-11-08T21:58:21Z | 1. On death screen, click `[ ПОДЕЛИТЬСЯ КАРТОЧКОЙ 📲 ]`.<br>2. Modal opens offering 9:16 (Story) and 1:1 (Post) canvas previews.<br>3. Assert `<canvas>` element exists with dimensions `1080x1920` (or `1080x1080`).<br>4. Call `canvas.toBlob('image/png')` in headless context.<br>5. Assert returned Blob size > 15,000 bytes without security tainted canvas errors. | High-resolution, viral graphic generated cleanly; download/share triggered without canvas taint exceptions. |

---

### Tier 2: Boundary & Corner Cases (Extreme Ages, Geo-Hazards & Stress)

| Test ID | Test Scenario | Edge Condition / Boundary | Test Steps & Invariants | Expected Result |
|---|---|---|---|---|
| **TC-T2-01** | **Infant Mortality (Age 0 Death)** | Country with high infant mortality (Chad, `im = 70.0`), Seed forced to fail $q_0$ roll | 1. Inject seed producing $r < q_0$ at age 0 in Chad.<br>2. Advance life by 1 step.<br>3. Verify transition to `#dead` at age 0.<br>4. Verify Cause of Death is neonatal (`neo`, `lri`, or `diar`).<br>5. Verify eulogy reflects infant loss without displaying adult career, marriage, or financial estate sections. | App does not crash on age 0 death. Adult UI sections gracefully hidden; valid pediatric eulogy rendered. |
| **TC-T2-02** | **Supercentenarian Boundary (Age 105–110+)** | Longevity outlier (Japan, `le = 84.5`), high health character surviving past 100 | 1. Inject seed producing survival up to age 105+.<br>2. Observe exponential mortality hazard increase.<br>3. Verify that at age 110, $q_{110} = 1.0$, guaranteeing death.<br>4. Verify absolute ceiling invariant: no character survives to age 126 under any possible PRNG sequence. | Extreme age handled gracefully. Death in sleep or natural causes triggered; strict age cap [0, 125] enforced. |
| **TC-T2-03** | **Extreme Economic Disparity** | Lowest GDP PPP ($1,000, Central African Rep.) vs Highest GDP PPP ($130,000, Luxembourg) | 1. Spawn character in CAF Q1 (bottom 20%).<br>2. Spawn character in LUX Q5 (top 20%).<br>3. Compare starting income and out-of-pocket health risk.<br>4. Verify global income percentile calculation: CAF Q1 is bottom 2% globally; LUX Q5 is top 0.1% globally. | Accurate log-normal income curve across 2 orders of magnitude. World percentiles match World Bank global distribution. |
| **TC-T2-04** | **War & Hazard Flag Triggers** | High war score country (`war > 0` e.g. Afghanistan, Syria) | 1. Spawn in active conflict zone.<br>2. At age 18, verify conscription check (`cs`) initiates military service.<br>3. Verify war mortality hazard multiplier ($4\times$) applied to annual hazard calculation.<br>4. Verify conflict chronicle entries and displacement refugee dilemma cards. | Conflict hazard flags alter mortality tables and decision pools in full alignment with real-world hazards. |
| **TC-T2-05** | **Session Corruption Recovery** | Malformed / Corrupted `localStorage` data | 1. Set `localStorage.setItem('one8b_state', '{ corrupted_json: NaN, age: "invalid" }')`.<br>2. Reload application.<br>3. Verify application initializes gracefully with clean state instead of showing white screen of death. | Resilient JSON parsing and state schema validation with automatic fallback reset. |
| **TC-T2-06** | **Audio Rapid Mute Stress** | Rapid volume toggling (50 clicks in 2s) | 1. Render HUD sound toggle button.<br>2. Dispatch 50 rapid click events.<br>3. Verify `SoundEngine.getMuted()` matches final DOM state.<br>4. Verify Web Audio `gainNode` matches muted state without memory leak or unhandled promise rejection. | Audio graph remains synchronized, zero audio distortion or unhandled promise rejections. |
| **TC-T2-07** | **Rapid Click & Race Condition Stress** | Double/Rapid clicking "+1 Год" button (100 clicks in 1 second) | 1. Simulate 100 rapid clicks on `+1 Год` button.<br>2. Verify age increments sequentially without skipping intermediate mortality checks.<br>3. Ensure no duplicate decision modals or orphan event logs are inserted. | UI buttons debounced or state transitions synchronized via transactional queue; state remains 100% consistent. |

---

### Tier 3: Cross-Feature Combinations (Interactions, Synergies & 18+ Filters)

| Test ID | Test Scenario | Cross-Feature Interaction | Test Steps & Invariants | Expected Result |
|---|---|---|---|---|
| **TC-T3-01** | **Smoking & Substance Hazard Multipliers** | Decision to smoke -> Health debuff -> Mortality hazard shift | 1. At age 16–18, choose Option "Start Smoking" in `DEC.smoke`.<br>2. Verify `smoker = true` flag set.<br>3. Assert Health stat degrades faster (additional -5 pts/yr).<br>4. Verify respiratory (`copd`), lung cancer (`can`), and heart disease (`ihd`) weights increase $2.0\times$ to $2.5\times$ in `causeWeights()`.<br>5. Choose "Quit Smoking" at age 30 -> verify gradual hazard tapering over 5 years. | Risk factor dynamically alters downstream epidemiological mortality matrix and lifespan trajectory. |
| **TC-T3-02** | **Addiction Spiral vs Career Progression** | Alcoholism / Narcotics flag -> Workplace stability -> Financial drain | 1. Trigger substance abuse decision.<br>2. Verify annual income penalty (addiction expense -25%).<br>3. Observe job loss / demotion dilemma card triggered by low Social/Health stats.<br>4. Verify cirrhosis (`cir`) and overdose (`od`) mortality causes unlocked. | Realistic multi-system breakdown reflects socio-economic impacts of addiction. |
| **TC-T3-03** | **Higher Education vs Child Labor Trade-off** | Schooling investment -> Career ceiling -> Lifetime wealth | 1. Branch A: Enroll in Tertiary Education (age 18–22) -> Student debt, 0 income, Smarts +20.<br>2. Branch B: Early informal labor at age 14 -> Immediate income, Smarts capped, Health -10.<br>3. Compare outcomes at age 40: Branch A unlocks Tier 3 professional jobs and higher income percentiles; Branch B encounters earlier physical health plateau. | Education model dynamically shifts career ladders, income ceilings, and occupational health penalties. |
| **TC-T3-04** | **Healthcare Out-of-Pocket Shock** | Catastrophic illness event in high OOP country (e.g. India, `oop = 77%`) | 1. Spawn character in high out-of-pocket health country.<br>2. Trigger severe illness event (tuberculosis, cardiovascular incident).<br>3. Verify out-of-pocket medical bill deducts up to 60% of liquid savings.<br>4. If savings < cost, verify character wealth quintile drops ($Q -> Q - 1$) and health recovery rate is impaired. | Medical bankruptcy mechanic authentically models poverty traps in low-safety-net healthcare systems. |
| **TC-T3-05** | **Safe Mode (12+) Content Filtering** | Enabling Safe Mode from 18+ gate | 1. Click `[ БЕЗОПАСНЫЙ РЕЖИМ (12+) 🛡️ ]` on initial modal.<br>2. Verify `one8b_safe_mode = 'true'`.<br>3. Run full simulation.<br>4. Assert zero occurrences of explicit substance abuse, suicide (`suic`), or graphic violence in event chronicle.<br>5. Verify cause of death is mapped to natural health/cardiac failure. | Safe mode preserves demographic realism while filtering out sensitive adult themes for minors and classrooms. |

---

### Tier 4: Real-World Application Workloads (Full Lifecycle Cohort Runs)

| Test ID | Country Archetype | Geographic & Statistical Profile | Automated End-to-End Simulation Checks | Pass Criteria |
|---|---|---|---|---|
| **TC-T4-01** | **Chad (TCD)** | Sub-Saharan Africa, High U5MR (`u5 = 110`), Low Life Expectancy (`le = 54.0`), Low GDP PPP | 1. Force spawn in Chad.<br>2. Turbo run through full life.<br>3. Verify under-5 survival challenge.<br>4. Verify infectious/malaria/nutrition events.<br>5. Complete to death screen. | Lifespan between 0 and 75 years; infectious/maternal/respiratory causes prevalent; zero console errors. |
| **TC-T4-02** | **Afghanistan (AFG)** | South/Central Asia, High Conflict (`war = 0.3`), High MMR (`mmr = 521`), Low Urbanization (`urb = 25%`) | 1. Force spawn in Afghanistan.<br>2. Verify conscription / armed conflict hazard triggers.<br>3. Verify maternal healthcare challenges if female.<br>4. Complete to death screen. | Conflict & structural health events trigger accurately; stats remain mathematically bounded; zero runtime errors. |
| **TC-T4-03** | **Japan (JPN)** | East Asia, Super-Aged Society, Ultra-High Longevity (`le = 84.5`), Low U5MR (`u5 = 2.4`) | 1. Force spawn in Japan.<br>2. Verify smooth survival through age 60+.<br>3. Verify retirement pension, advanced healthcare events.<br>4. Verify chronic elderly diseases (dementia, stroke, cancer). | Lifespan typically exceeds 75+ years; adult lifestyle & aging chronicle items; zero console errors. |
| **TC-T4-04** | **Germany (DEU)** | Western Europe, Low Inequality (Gini 0.31), Universal Healthcare (low OOP), High Net Penetration | 1. Force spawn in Germany.<br>2. Verify stable income distribution across quintiles.<br>3. Verify social welfare safety nets during crises.<br>4. Complete to death screen. | Coherent social market economy dynamics; high tertiary education access; clean recap generation. |
| **TC-T4-05** | **Brazil (BRA)** | Latin America, High Urbanization (`urb = 87%`), High Inequality (Gini 0.53), High Homicide (`hom = 22`) | 1. Force spawn in Brazil.<br>2. Verify wide income divergence between Q1 and Q5.<br>3. Verify urban violence / traffic accident hazard weighting.<br>4. Complete to death screen. | Urban demographic dynamics faithfully modeled; wealth quintile Gini dispersion verified; zero errors. |
| **TC-T4-06** | **Global 100-Life Batch Cohort Stress** | Random global sampling across all 173 countries | 1. Run 100 consecutive full lifetimes in automated headless mode.<br>2. Record summary statistics across all runs.<br>3. Assert 100% of lives transition cleanly to `#dead`.<br>4. Assert global mean life expectancy in [68.0, 75.0] years.<br>5. Assert global infant mortality share matches global ~4-5% rate.<br>6. Assert exactly zero `console.error` calls across entire batch. | Complete macro-demographic alignment; rock-solid memory stability (< 80MB heap); zero memory leaks. |

---

## 4. Performance Budgets & Acceptance SLA Benchmarks

| Metric | Target SLA | Hard Invalidation Threshold | Verification Tool |
|---|---|---|---|
| **First Contentful Paint (FCP)** | <= 400ms | > 800ms | Playwright performance timing |
| **Time to Interactive (TTI)** | <= 600ms | > 1200ms | Headless trace |
| **Year Increment Turn Latency** | <= 8ms | > 25ms | `performance.now()` delta |
| **Turbo Mode Step Speed** | 300ms +/- 30ms / yr | > 500ms / yr | Headless animation clock |
| **Full Life Execution (0–80 yrs, Turbo)** | <= 3.0s | > 6.0s | E2E runner duration |
| **Canvas Graphic Generation** | <= 100ms | > 300ms | `canvas.toBlob()` timer |
| **Memory Heap Stability** | <= 60MB | > 150MB | Chrome Memory Heap profiler |
| **Console Errors / Warnings** | 0 | >= 1 | `page.on('console')` strict interceptor |

---

## 5. Layout Ergonomics & Viewport Boundary Rules

### 5.1 Mobile Ergonomics (Width: 360px – 430px)
- **Thumb Zone Compliance**: All primary interactions (`+1 Год`, `Turbo`, `Выбор решения`) must reside within the bottom 35% of the viewport (`fixed bottom-0` or bottom action sheet).
- **Minimum Touch Targets**: Every button, pill toggle, or link must measure at least 44x44px to comply with WCAG 2.2 AA touch target guidelines.
- **Dynamic Viewport Height (`dvh`)**: Mobile containers must use `100dvh` rather than `100vh` to prevent interface jitter caused by mobile browser address bar collapse.
- **Strict Horizontal Overflow Lock**: `overflow-x: hidden` enforced at `html, body, #root`; verified programmatically by asserting `scrollWidth <= clientWidth`.

### 5.2 Desktop Ergonomics (Width: 1024px – 2560px)
- **Max Content Container**: Constrained to `max-w-6xl` (1152px) centered with auto-margins to avoid eye-strain on ultra-wide displays.
- **Multi-Column Dashboard**: 3-column structured grid (Left: Character ID & Family, Center: Chronicle Stream & Decisions, Right: World Benchmarks & Survival Curve).
- **Keyboard Shortcuts**: Spacebar / Enter triggers `+1 Год`, Arrow keys select Decision options (Left = Option A, Right = Option B), 'M' toggles audio mute.
