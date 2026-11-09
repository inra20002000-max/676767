import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Shield, Activity, Globe } from 'lucide-react';
import { soundEngine } from '../engine/soundEngine';

export interface HeaderHUDProps {
  title?: string;
  countryName?: string;
  countryFlag?: string;
  age?: number;
  statusBadge?: string;
  soundMuted?: boolean;
  onToggleSound?: (muted: boolean) => void;
  voiceMuted?: boolean;
  onToggleVoice?: (muted: boolean) => void;
  safeMode?: boolean;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  title = '1in8b.life',
  countryName,
  countryFlag,
  age,
  statusBadge = 'DEMOGRAPHIC SIM',
  soundMuted: controlledSfxMuted,
  onToggleSound,
  voiceMuted: controlledVoiceMuted,
  onToggleVoice,
  safeMode = false,
}) => {
  const [internalSfxMuted, setInternalSfxMuted] = useState(soundEngine.isSfxMuted());
  const [internalVoiceMuted, setInternalVoiceMuted] = useState(soundEngine.isVoiceMuted());

  useEffect(() => {
    setInternalSfxMuted(soundEngine.isSfxMuted());
    setInternalVoiceMuted(soundEngine.isVoiceMuted());
  }, []);

  const sfxMuted = controlledSfxMuted !== undefined ? controlledSfxMuted : internalSfxMuted;
  const voiceMuted = controlledVoiceMuted !== undefined ? controlledVoiceMuted : internalVoiceMuted;

  const handleToggleSfx = () => {
    const nextMuted = soundEngine.toggleSfx();
    setInternalSfxMuted(nextMuted);
    if (onToggleSound) {
      onToggleSound(nextMuted);
    }
  };

  const handleToggleVoice = () => {
    const nextMuted = soundEngine.toggleVoice();
    setInternalVoiceMuted(nextMuted);
    if (onToggleVoice) {
      onToggleVoice(nextMuted);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-canvas-card/95 backdrop-blur-md border-b-2 border-black/80 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-display font-black text-lg sm:text-xl tracking-tight text-white select-none">
            <span className="bg-neon-pink text-black px-1.5 py-0.5 rounded font-mono font-extrabold text-sm sm:text-base border border-black shadow-neo-sm">
              1in8b
            </span>
            <span className="hidden sm:inline text-white font-extrabold">
              {title === '1in8b.life' ? 'REIMAGINED' : title}
            </span>
          </div>

          <span
            data-testid="status-badge"
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold uppercase bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40"
          >
            <Activity className="w-3 h-3 animate-pulse" />
            {statusBadge}
          </span>

          {safeMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-neon-lime/15 text-neon-lime border border-neon-lime/40">
              <Shield className="w-2.5 h-2.5" />
              12+ SAFE
            </span>
          )}
        </div>

        {/* Center: Dynamic Character HUD pills (if active) */}
        {(countryName || age !== undefined) && (
          <div className="flex items-center gap-2 bg-canvas-dark px-3 py-1 rounded-xl border border-canvas-border">
            {countryName && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                <span className="text-base">{countryFlag || <Globe className="w-4 h-4 text-neon-cyan" />}</span>
                <span>{countryName}</span>
              </div>
            )}
            {age !== undefined && (
              <div className="text-xs font-mono font-extrabold text-neon-yellow pl-1.5 border-l border-white/20">
                {age} {age === 1 ? 'ГОД' : age < 5 ? 'ГОДА' : 'ЛЕТ'}
              </div>
            )}
          </div>
        )}

        {/* Right: Dual Audio & Voice Controls */}
        <div className="flex items-center gap-2">
          {/* Voice Narration Toggle */}
          <button
            type="button"
            data-testid="btn-voice-toggle"
            aria-label={voiceMuted ? 'Включить голосовую озвучку' : 'Выключить голосовую озвучку'}
            onClick={handleToggleVoice}
            className={`p-2 rounded-xl border-2 border-black font-mono text-xs font-black transition-all duration-100 flex items-center gap-1.5 shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer select-none ${
              voiceMuted
                ? 'bg-canvas-subtle text-gray-400 hover:text-white hover:border-gray-400'
                : 'bg-neon-yellow text-black hover:bg-neon-yellow/90'
            }`}
            title={voiceMuted ? 'Включить диктора (озвучка событий)' : 'Выключить диктора'}
          >
            {voiceMuted ? (
              <>
                <MicOff className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">ГОЛОС: ВЫКЛ</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">ГОЛОС: ВКЛ</span>
              </>
            )}
          </button>

          {/* Sound SFX Toggle */}
          <button
            type="button"
            data-testid="btn-sound-toggle"
            aria-label={sfxMuted ? 'Включить звуковые эффекты' : 'Выключить звуковые эффекты'}
            onClick={handleToggleSfx}
            className={`p-2 rounded-xl border-2 border-black font-mono text-xs font-black transition-all duration-100 flex items-center gap-1.5 shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer select-none ${
              sfxMuted
                ? 'bg-canvas-subtle text-gray-400 hover:text-white hover:border-gray-400'
                : 'bg-neon-cyan text-black hover:bg-neon-cyan/90'
            }`}
            title={sfxMuted ? 'Включить звуковые эффекты' : 'Выключить звуковые эффекты'}
          >
            {sfxMuted ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">SFX: ВЫКЛ</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">SFX: ВКЛ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default HeaderHUD;
