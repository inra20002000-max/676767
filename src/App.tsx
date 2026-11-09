import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeaderHUD from './components/HeaderHUD';
import DisclaimerModal from './components/DisclaimerModal';
import BirthLottery from './components/BirthLottery';
import LifeDashboard from './components/LifeDashboard';
import MemorialScreen from './components/MemorialScreen';
import CanvasShareModal from './components/CanvasShareModal';
import DecisionModal from './components/DecisionModal';
import type { CharacterState, FocusType } from './types/simulation';
import type { DecisionCard } from './types/events';
import { generateBirth } from './engine/simulationCore';
import { stepYear, resolveDecisionChoice } from './engine/lifeStages';
import { soundEngine } from './engine/soundEngine';

export type GameStage = 'lottery' | 'playing' | 'memorial';

export const App: React.FC = () => {
  const [isAgeConfirmed, setIsAgeConfirmed] = useState<boolean>(false);
  const [safeMode, setSafeMode] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);

  const [gameStage, setGameStage] = useState<GameStage>('lottery');
  const [character, setCharacter] = useState<CharacterState>(() =>
    generateBirth({ seed: Math.floor(Math.random() * 1000000), mode: 'birth' })
  );

  const [currentFocus, setCurrentFocus] = useState<FocusType>('health');
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [activeDecision, setActiveDecision] = useState<DecisionCard | null>(null);
  const [decisionOutcome, setDecisionOutcome] = useState<{
    text: string;
    isRiskFailed: boolean;
    isDeath: boolean;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const cooldownDecisionsRef = useRef<Set<string>>(new Set());
  const turboTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync initial localStorage flags
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const confirmed = localStorage.getItem('one8b_age_confirmed') === 'true';
        const isSafe = localStorage.getItem('one8b_safe_mode') === 'true';
        setIsAgeConfirmed(confirmed);
        setSafeMode(isSafe);
        setShowDisclaimer(!confirmed);
      } catch {
        setIsAgeConfirmed(false);
        setSafeMode(false);
        setShowDisclaimer(true);
      }
    }
  }, []);

  const handleConfirmAge = (safe: boolean) => {
    setIsAgeConfirmed(true);
    setSafeMode(safe);
    setShowDisclaimer(false);
    soundEngine.playSuccess();
  };

  // Start Life from Birth Lottery
  const handleStartLife = (startingChar: CharacterState) => {
    setCharacter(startingChar);
    setGameStage('playing');
  };

  // Advance 1 year
  const handleAdvanceYear = useCallback(() => {
    setCharacter((prevChar) => {
      if (!prevChar.isAlive) {
        setGameStage('memorial');
        setIsTurbo(false);
        return prevChar;
      }

      const res = stepYear(
        prevChar,
        currentFocus,
        undefined,
        cooldownDecisionsRef.current
      );

      if (res.decision && res.nextState.isAlive) {
        setActiveDecision(res.decision);
        cooldownDecisionsRef.current.add(res.decision.id);
        setIsTurbo(false); // Pause auto-play for interactive decision
      }

      if (!res.nextState.isAlive) {
        setIsTurbo(false);
        setGameStage('memorial');
      }

      return res.nextState;
    });
  }, [currentFocus]);

  // Handle Decision Choice
  const handleSelectDecisionOption = (optionId: string) => {
    if (!activeDecision) return;

    const resolution = resolveDecisionChoice(
      character,
      activeDecision,
      optionId
    );

    // Append decision event to chronicle
    const decisionLogEvent = {
      age: resolution.nextState.age,
      text: `Выбор: ${activeDecision.title} — ${resolution.outcomeText}`,
      category: (resolution.isDeath
        ? 'death'
        : resolution.isRiskFailed
        ? 'crisis'
        : 'decision') as
        | 'death'
        | 'crisis'
        | 'decision'
        | 'milestone'
        | 'health'
        | 'general',
    };

    const finalState: CharacterState = {
      ...resolution.nextState,
      history: [...(resolution.nextState.history ?? []), decisionLogEvent],
    };

    setCharacter(finalState);
    setActiveDecision(null);

    if (resolution.isDeath || !finalState.isAlive) {
      setIsTurbo(false);
      setGameStage('memorial');
    } else if (resolution.isRiskFailed) {
      setDecisionOutcome({
        text: resolution.outcomeText,
        isRiskFailed: true,
        isDeath: false,
      });
    }
  };

  // Turbo Loop: 0.3s/yr (300ms)
  useEffect(() => {
    if (isTurbo && gameStage === 'playing' && character.isAlive && !activeDecision) {
      turboTimerRef.current = setInterval(() => {
        handleAdvanceYear();
      }, 300);
    } else {
      if (turboTimerRef.current) {
        clearInterval(turboTimerRef.current);
        turboTimerRef.current = null;
      }
    }

    return () => {
      if (turboTimerRef.current) {
        clearInterval(turboTimerRef.current);
        turboTimerRef.current = null;
      }
    };
  }, [isTurbo, gameStage, character.isAlive, activeDecision, handleAdvanceYear]);

  // Restart Life
  const handleRestartLife = () => {
    const nextChar = generateBirth({
      seed: Math.floor(Math.random() * 1000000),
      mode: 'birth',
    });
    cooldownDecisionsRef.current.clear();
    setCharacter(nextChar);
    setGameStage('lottery');
    setActiveDecision(null);
    setDecisionOutcome(null);
    setIsTurbo(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-canvas-dark text-white overflow-x-hidden selection:bg-neon-pink selection:text-white">
      {/* Offscreen verification canvas for verify-browser suite 3 */}
      <canvas
        id="verification-canvas"
        width={100}
        height={100}
        className="hidden"
        aria-hidden="true"
      />

      {/* 18+ Content Advisory & Gate Modal */}
      <DisclaimerModal
        isOpen={showDisclaimer}
        onConfirm={handleConfirmAge}
      />

      {/* Sticky Header HUD */}
      <HeaderHUD
        title="1in8b.life"
        countryName={character.country?.ru}
        countryFlag={character.country?.id ? undefined : undefined}
        age={gameStage !== 'lottery' ? character.age : undefined}
        statusBadge={
          gameStage === 'lottery'
            ? 'BIRTH LOTTERY'
            : gameStage === 'playing'
            ? isTurbo
              ? 'TURBO SPEED'
              : 'LIVE SIM'
            : 'MEMORIAL'
        }
        safeMode={safeMode}
      />

      {/* Main Interactive Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {gameStage === 'lottery' && (
          <BirthLottery
            onStartLife={handleStartLife}
            initialCharacter={character}
          />
        )}

        {gameStage === 'playing' && (
          <LifeDashboard
            character={character}
            onAdvanceYear={handleAdvanceYear}
            isTurbo={isTurbo}
            onToggleTurbo={setIsTurbo}
            currentFocus={currentFocus}
            onSelectFocus={setCurrentFocus}
          />
        )}

        {gameStage === 'memorial' && (
          <MemorialScreen
            character={character}
            onRestartLife={handleRestartLife}
            onOpenShareModal={() => setShowShareModal(true)}
          />
        )}
      </main>

      {/* Decision Modal */}
      <DecisionModal
        decision={activeDecision}
        onSelectOption={handleSelectDecisionOption}
        outcomeAlert={decisionOutcome}
        onDismissOutcome={() => setDecisionOutcome(null)}
      />

      {/* Canvas Share Modal (9:16 Story & 1:1 Post) */}
      <CanvasShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        character={character}
      />

      {/* Footer */}
      <footer className="w-full border-t border-canvas-border/60 py-4 px-4 text-center text-xs font-mono text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            1in8b.life Reimagined · Open Global Demographics (UN WPP 2024 / WHO GHE / World Bank)
          </div>
          <div className="text-[11px] text-gray-400">
            Состояние возраста: {isAgeConfirmed ? '18+ Подтверждено' : 'Ожидает согласия'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
