# Project: Life Simulator (1in8b Reimagined for Gen Z & Gen Alpha)

## Architecture
The application is architected as an ultra-responsive, zero-backend, 100% client-side Progressive Web Application (PWA/SPA) built with:
- **Core Framework**: React 18/19 with TypeScript in strict mode.
- **Build Tooling**: Vite with `npm.cmd` execution standard for Windows 11.
- **Styling & Design System**: Tailwind CSS configured with a Gen Z / Gen Alpha Neo-Brutalist & Cyber-Pop theme (high-contrast dark canvas `#0D0F17`, electric neon accents, 2-3px bold borders, tactile drop shadows `shadow-[4px_4px_0px_#000]`).
- **Motion & Interactions**: Framer Motion for kinetic spring animations, odometer age rolls, card flips, and confetti.
- **Audio Engine**: Dual-system procedural sound subsystem on Web Audio API (`SoundEngine` tactile clicks, heartbeat, bells, plus ambient drone synth) and expressive age-modulated Russian Web Speech API narration (`ru-RU`).
- **Pixel Art Engine**: 100% client-side procedural pixel art canvas (`192×60`, ground $Y=48$) rendering demographic Fitzpatrick skin tones (`sk0`..`sk5`), 5 age groups, elderly canes, mobility aids, 6 pet species, vehicles (cars, motorcycles), 9 housing tiers, 9 workplace backdrops, and 40 life moment vignettes with particle shaders.
- **Family System**: Relational family model (`FamilyState`) tracking parents, dynamic aging, Gompertz parental mortality, TFR-derived siblings, marital status, children, and living/housing conditions.
- **Demographic Engine**: Embedded compact TypeScript datasets (~130KB gzipped) compiled from authoritative UN WPP 2024, WHO GHE 2021, and World Bank releases, alongside live 1in8b engine v1 catalog dumps.
- **API Integration**: Hybrid offline-first integration with official 1in8b API (`/api/v1/live` and `/api/v1/life` using user key `k8b_2a961a97ac1ceb3b93de49e456a6be27`), 3.5s timeout, and seamless offline fallback.
- **End-of-Life Visuals**: 5-children dot-matrix world infographic (`WORLD.land` 2,804 dots, 173 country coordinates, comparative lifespan bars) and interactive Life Film Replay player with dual-canvas ping-pong transitions and procedural `filmAudio` synthesizer.
- **Sharing**: Client-side HTML5 Canvas 2D engine exporting 1080x1920 (9:16 Story), 1080x1080 (1:1 Post), and 1080x1350 (5-Children World Infographic) graphics.
- **Testing**: Automated Vitest unit suites, Playwright headless multi-viewport browser runner, adversarial stress test harness, and zero console errors.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 18+ Disclaimer & Age Gate Modal | Age confirmation modal (18+), content warnings (smoking, substances, blood, mental health), educational non-advocacy clause, and local persistence. | M1 | User Clarification 2026-11-08T22:00:56Z |
| 2 | Neo-Brutalist Cyber-Pop UI Theme | Kinetic dark/neon aesthetic, tactile elevation, bold typography, mobile-first thumb navigation shell. | M1 | R2, explorer_survey_3 |
| 3 | Procedural Web Audio Engine | Oscillator-based audio synthesizer for tactile clicks, milestones, death bells, and mute toggle. | M1 | R2, explorer_survey_3 |
| 4 | 172-Country Demographic Dataset | Comprehensive profiles: births, pop, life expectancy, infant mortality, GDP PPP, Gini, urbanization, TFR, and Russian names. | M2 | R1, spec_miner_api |
| 5 | Birth Lottery Sampling Engine | Cumulative distribution sampling weighted by annual births (`b`) or total population (`pop`). | M2 | R1, spec_miner_survey_1 |
| 6 | Gompertz-Makeham Life Table Calibration | 50-step bisection numerical solver computing age-specific mortality probabilities $q_x$ from 0 to 110. | M2 | R1, explorer_survey_2 |
| 7 | Core Attributes Engine | Tracking and clamping of Health (`hl`), Happiness (`h`), Smarts (`sm`), and Social (`so`) on a 0-100 scale. | M2 | R1, spec_miner_survey_1 |
| 8 | Lognormal Income & Wealth Percentiles | National Gini-based income sampling, PPP currency conversion, and global wealth percentile ranking (`worldPct`). | M2 | R1, explorer_survey_2 |
| 9 | 33 Causes of Death Matrix | 7-region × 7-age-band epidemiological cause distribution matrix with lifestyle risk multipliers. | M2 | R1, spec_miner_api |
| 10 | Dynamic Life Stage Progression | State machine driving 6 stages: `baby`, `school`, `kidwork`, `service`, `adult`, `elder`. | M3 | R1, spec_miner_survey_1 |
| 11 | Annual Focus Selector | 15 strategic focus categories modifying yearly stat trajectories. | M3 | R1, spec_miner_survey_1 |
| 12 | 101 Interactive Decision Cards | Branching dilemma cards with explicit consequence badges (`+15 🎓`, `-10 💰`, `⚠️ Риск`). | M3 | R1, R2, explorer_survey_3 |
| 13 | Demographic Event Engine | Probabilistic real-world life occurrences with institutional UN/WHO footnotes. | M3 | R1, explorer_survey_2 |
| 14 | 18+ Raw Realism Loops | Addictions (smoking, alcohol, narcotics), violence, poverty traps, occupational hazards, and mental health crises. | M3 | User Clarification 2026-11-08T22:00:56Z |
| 15 | Companion Lives Simulator | 4 parallel babies born at the exact same moment across the globe, updating their life status in parallel. | M3 | spec_miner_survey_1 |
| 16 | Turn-Based Fast Pacing ("+1 Год") | Sub-16ms instant state transition per year tap, eliminating original 1in8b glacial waiting times. | M4 | R2, explorer_survey_3 |
| 17 | Turbo Auto-Play Engine | 0.3s/yr rapid progression mode with automatic pause upon encountering decision cards. | M4 | R2, explorer_survey_3 |
| 18 | 10x10 Life Grid & Chronicle Feed | Visual 100-year matrix highlighting milestone years and rich chronological life feed. | M4 | R1, R2, spec_miner_survey_1 |
| 19 | End-of-Life Memorial Screen | Cause of death, localized eulogy, estate division, lifetime highlights, and philosophical reflection. | M4 | R1, spec_miner_survey_1 |
| 20 | Global Benchmarking Percentiles | Longevity, wealth, and education percentile comparisons against all living humanity. | M4 | R1, explorer_survey_2 |
| 21 | HTML5 Canvas Social Recap Generator | Viral 9:16 (Story) and 1:1 (Post) image export with archetype badges and replay seeds. | M4 | R2, explorer_survey_3 |
| 22 | 4-Tier Automated E2E Verification | 25 automated test scenarios, Vitest unit suite, Playwright headless browser check, zero console errors. | M5 | Acceptance Criteria, TEST_INFRA.md |
| 23 | Procedural Pixel Art Canvas Engine | Native 192×60 canvas buffer, $Y_G=48$ ground baseline, 4×4 Bayer matrix ordered dithering, dual-theme semantic palette (`PX_PAL`), crisp high-DPI scaling. | M6 | spec_miner_v2_pixel, User Request 1 |
| 24 | Fitzpatrick Skin Tones & Genetics | 6-tier Fitzpatrick scale (`sk0`..`sk5`), 17 regional probability vectors, country mapping (`SKIN_C`), parental and offspring genetic blending. | M6 | spec_miner_v2_pixel, User Request 1 |
| 25 | Character, Pet & Vehicle Sprites | ASCII sprite templates across 5 age groups, elder canes/grey hair, wheelchair/crutch aids, 6 pet species, cars, and motorcycles. | M6 | spec_miner_v2_pixel, User Request 1 |
| 26 | Dynamic Scenery & Housing Engine | Procedural skies, clouds, trees, poles, 9 housing tiers (shack, hut, flat, villa, mansion), 9 workplace buildings, and 13 vocation props. | M6 | spec_miner_v2_pixel, User Request 1 |
| 27 | 40 Life Moments & Cultural Funerals | Dedicated narrative vignettes (`pxMoment`), visual particle effects (confetti, petals, lanterns), and 5 cultural funeral rites (`pxFuneral`). | M6 | spec_miner_v2_pixel, User Request 1 |
| 28 | Dynamic Family Relational Model | Mother, Father, Siblings array, marital status, partner, children, TFR-based sibling counts, dynamic yearly aging and Gompertz mortality. | M7 | explorer_v2_family_film, User Request 2 |
| 29 | Family Dossier HUD Card | Neo-brutalist "Семья и жизнь" card component (`FamilyCard.tsx`) with collapsible details, status badges, and housing info. | M7 | explorer_v2_family_film, User Request 2 |
| 30 | Expressive Russian Voice Delivery | Age-modulated pitch curves (1.40 for toddlers down to 0.85 for elders), narrative event inflections, and Chromium anti-stall guard. | M8 | explorer_v2_world_audio_api, User Request 5 |
| 31 | Procedural Web Audio Ambient Soundtrack | Dual-oscillator drone with breathing LFO filter (0.07Hz) and reactive mood shifts for health, wealth, and crisis states. | M8 | explorer_v2_world_audio_api, User Request 5 |
| 32 | Official 1in8b API Hybrid Engine | Integration of `/api/v1/live` and `/api/v1/life` with user key `k8b_2a961a97ac1ceb3b93de49e456a6be27`, direct browser CORS, 3.5s timeout, and seamless offline fallback. | M8 | explorer_v2_world_audio_api, User Request 6 |
| 33 | "Same Second 5 Children" World Infographic | 156×66 dot-matrix global map with 2,804 land coordinates, 173 country coordinates, anti-collision markers (1: Me, 2-5: Companions), and 5 comparative lifespan bars. | M9 | explorer_v2_world_audio_api, User Request 4 |
| 34 | 5-Children Infographic PNG Export | 1080×1350 Canvas export with Web Share API and 1-click download. | M9 | explorer_v2_world_audio_api, User Request 4 |
| 35 | Interactive Life Film / Replay Player | Dual-canvas crossfade player, 8-14 milestone life frames, timeline scrubber (0..death age), 1x/2x/5x speed controls, pause/play, and seed export. | M9 | explorer_v2_family_film, User Request 3 |
| 36 | Procedural Life Film Soundtrack (`filmAudio`) | Procedural Web Audio music synthesizer with 4 instrument timbres, algorithmic convolution reverb, and pentatonic progression. | M9 | explorer_v2_family_film, User Request 3 |
| 37 | 100 Features & Viral Mechanics Catalog | Comprehensive ideation document `docs/100_IDEAS.md` across 5 categories with TOP 10 roadmap. | M6-M9 | brainstorm_squad, User Mandate |
| 38 | Full v2 E2E Verification & Build | Full Vitest test suites, Playwright headless multi-viewport runner, 0 console errors, adversarial stress testing, and production build. | M10 | Project Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Scaffold, Build System & Design System | Vite + React + TS strict setup, Tailwind neo-brutalist theme, SoundEngine, 18+ Disclaimer Gate Modal. | none | DONE |
| 2 | Demographic Data & Simulation Core | 172-country dataset, Gompertz-Makeham bisection engine, birth lottery, Gini income, 33 causes of death, core stat tracking. | M1 | DONE |
| 3 | Stages, Event Engine & 101 Decision Trees | 6 life stages, 15 annual focuses, 101 decision cards with Gen Z badges, 18+ realism loops, companion lives. | M2 | DONE |
| 4 | Interactive UI, Pacing & Canvas Recap | Turn-based "+1 Год", Turbo auto-play, 10x10 life grid, death memorial screen, 9:16 & 1:1 Canvas recap export. | M3 | DONE |
| 5 | E2E Integration, Verification & Audit | 100% E2E test pass (Tiers 1-4), Playwright multi-viewport check, zero console errors, Tier 5 adversarial audit. | M4 | DONE |
| 6 | Pixel Art Engine & Dynamic Scene Generator | 192×60 canvas engine, palettes, Fitzpatrick genetics, character/pet/car sprites, housing, weather, moments, `PixelArtScene.tsx`. | M1-M4 | DONE |
| 7 | Family Generation & Living Dossier | `familyEngine.ts`, `FamilyCard.tsx`, parents, dynamic aging, TFR siblings, housing dossier, integration with `simulationCore.ts` and `LifeDashboard.tsx`. | M2, M3 | IN_PROGRESS |
| 8 | Audio Upgrades & 1in8b API Integration | Expressive Russian TTS pitch curves, procedural ambient Web Audio synth, `apiClient.ts` fail-soft hybrid mode. | M1, M2 | PLANNED |
| 9 | 5-Children World Infographic & Life Film Replay | 156×66 dot-matrix map, lifespan bars, 1080×1350 PNG export, `LifeFilmPlayer.tsx`, procedural `filmAudio.ts`, integration in `MemorialScreen.tsx`. | M6, M7, M8 | PLANNED |
| 10 | Full v2 E2E Integration, Playwright & Build | Vitest suites, Playwright multi-viewport runner, zero console errors, adversarial stress tests, production build. | M6, M7, M8, M9 | PLANNED |

## Interface Contracts

### M6 (Pixel Art Engine)
- Target Files:
  - `src/types/pixelArt.ts`
  - `src/engine/pixelArt/palette.ts`
  - `src/engine/pixelArt/skinTones.ts`
  - `src/engine/pixelArt/sprites.ts`
  - `src/engine/pixelArt/scenery.ts`
  - `src/engine/pixelArt/housing.ts`
  - `src/engine/pixelArt/moments.ts`
  - `src/engine/pixelArt/renderer.ts`
  - `src/components/PixelArtScene.tsx`
- Interface:
  ```typescript
  export interface SceneContext {
    age: number;
    sex: 'M' | 'F';
    countryId: string;
    wealthQuintile: number;
    homeType?: string;
    familyMembers?: { role: string; age: number; sex: 'M' | 'F' }[];
    petType?: 'd' | 'c' | 'h' | 'r' | 'b' | 'f';
    vehicleType?: 'car' | 'moto' | 'bike';
    timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
    weather?: 'clear' | 'clouds' | 'rain' | 'snow';
    moment?: string;
    isDeceased?: boolean;
    religionId?: string;
  }
  export function renderPixelScene(ctx: CanvasRenderingContext2D, context: SceneContext): void;
  ```

### M7 (Family System)
- Target Files:
  - `src/types/family.ts`
  - `src/engine/familyEngine.ts`
  - `src/components/FamilyCard.tsx`
- Interface:
  ```typescript
  export interface FamilyState {
    mother: { name: string; age: number; job: string; isAlive: boolean };
    father: { name: string; age: number; job: string; isAlive: boolean; isAbsent: boolean };
    siblings: Array<{ id: string; name: string; age: number; sex: 'M' | 'F'; isOlder: boolean; isAlive: boolean; atHome: boolean }>;
    partner?: { name: string; age: number; job: string; isMarried: boolean };
    children: Array<{ id: string; name: string; age: number; sex: 'M' | 'F' }>;
    housing: { type: string; ownership: boolean; city: string; livingWith: string };
  }
  export function generateInitialFamily(countryId: string, wealthQuintile: number, prng: () => number): FamilyState;
  export function stepFamilyYear(current: FamilyState, characterAge: number, countryId: string, prng: () => number): { nextFamily: FamilyState; familyEvents: string[] };
  ```

### M8 (Audio & API)
- Target Files:
  - `src/engine/soundEngine.ts` (extended with pitch modulation & ambient drone)
  - `src/services/apiClient.ts`
- Interface:
  ```typescript
  export function setNarratorAge(age: number): void;
  export function setAmbientPlaying(play: boolean): void;
  export function fetchLiveCharacter(country?: string): Promise<LiveCharacterResponse | null>;
  ```

### M9 (5-Children World Infographic & Life Film Replay)
- Target Files:
  - `src/data/worldMapData.ts` (156×66 dot-matrix land coordinates & 173 country coordinates)
  - `src/engine/worldMapEngine.ts`
  - `src/engine/filmAudio.ts`
  - `src/components/WorldCard5Children.tsx`
  - `src/components/LifeFilmPlayer.tsx`

### M10 (E2E Verification & Build)
- Commands:
  - `npm.cmd test` (100% pass)
  - `npm.cmd run build` (clean exit code 0)
  - `node scripts/verify-browser.js` (Playwright 4 viewports, 0 console errors)

## Code Layout
```
d:\сайтик\
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── docs/
│   └── 100_IDEAS.md
├── scripts/
│   ├── verify-browser.js
│   └── verify-adversarial-m4.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   ├── demographics.ts
    │   ├── simulation.ts
    │   ├── events.ts
    │   ├── pixelArt.ts
    │   ├── family.ts
    │   └── replay.ts
    ├── data/
    │   ├── countries.ts
    │   ├── causes.ts
    │   ├── jobs.ts
    │   ├── groups.ts
    │   ├── events.ts
    │   ├── decisions.ts
    │   └── worldMapData.ts
    ├── engine/
    │   ├── prng.ts
    │   ├── lifeTable.ts
    │   ├── economy.ts
    │   ├── simulationCore.ts
    │   ├── soundEngine.ts
    │   ├── familyEngine.ts
    │   ├── filmAudio.ts
    │   ├── worldMapEngine.ts
    │   └── pixelArt/
    │       ├── palette.ts
    │       ├── skinTones.ts
    │       ├── sprites.ts
    │       ├── scenery.ts
    │       ├── housing.ts
    │       ├── moments.ts
    │       └── renderer.ts
    ├── services/
    │   └── apiClient.ts
    ├── components/
    │   ├── DisclaimerModal.tsx
    │   ├── HeaderHUD.tsx
    │   ├── BirthLottery.tsx
    │   ├── LifeDashboard.tsx
    │   ├── DecisionModal.tsx
    │   ├── ChronicleFeed.tsx
    │   ├── LifeGrid.tsx
    │   ├── FamilyCard.tsx
    │   ├── PixelArtScene.tsx
    │   ├── WorldCard5Children.tsx
    │   ├── LifeFilmPlayer.tsx
    │   ├── MemorialScreen.tsx
    │   └── CanvasShareModal.tsx
    └── test/
        ├── prng.test.ts
        ├── lifeTable.test.ts
        ├── economy.test.ts
        ├── simulation.test.ts
        ├── pixelArt.test.ts
        ├── family.test.ts
        └── worldMap.test.ts
```
