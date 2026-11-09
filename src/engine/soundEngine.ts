export type SoundEvent = 'click' | 'step' | 'milestone' | 'crisis' | 'death' | 'heartbeat';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted: boolean = false;
  private voiceMuted: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        // Migration support: fallback to legacy one8b_muted if one8b_sfx_muted is not set
        const legacyMuted = localStorage.getItem('one8b_muted') === 'true';
        const storedSfx = localStorage.getItem('one8b_sfx_muted');
        this.sfxMuted = storedSfx !== null ? storedSfx === 'true' : legacyMuted;

        const storedVoice = localStorage.getItem('one8b_voice_muted');
        this.voiceMuted = storedVoice !== null ? storedVoice === 'true' : false;
      } catch {
        this.sfxMuted = false;
        this.voiceMuted = false;
      }
    }

    if (typeof window !== 'undefined') {
      this.initVoiceEngine();
    }
  }

  // ==================== AUDIO CONTEXT & UNLOCK ====================

  public initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch {
        this.ctx = null;
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.initCtx();
    // Warm up speech synthesis on user interaction
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
  }

  // ==================== SFX CONTROLS ====================

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public toggleSfx(): boolean {
    this.sfxMuted = !this.sfxMuted;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('one8b_sfx_muted', String(this.sfxMuted));
        localStorage.setItem('one8b_muted', String(this.sfxMuted));
      } catch {}
    }
    if (!this.sfxMuted) {
      this.playClick();
    }
    return this.sfxMuted;
  }

  public setSfxMuted(muted: boolean): void {
    this.sfxMuted = muted;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('one8b_sfx_muted', String(this.sfxMuted));
        localStorage.setItem('one8b_muted', String(this.sfxMuted));
      } catch {}
    }
  }

  // Backward compatibility alias for single-sound toggle
  public toggleMute(): boolean {
    return this.toggleSfx();
  }

  public getMuted(): boolean {
    return this.sfxMuted;
  }

  public isMuted(): boolean {
    return this.sfxMuted;
  }

  public setMuted(muted: boolean): void {
    this.setSfxMuted(muted);
  }

  // ==================== VOICE SYNTHESIS CONTROLS ====================

  public isVoiceMuted(): boolean {
    return this.voiceMuted;
  }

  public toggleVoice(): boolean {
    this.voiceMuted = !this.voiceMuted;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('one8b_voice_muted', String(this.voiceMuted));
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      if (this.voiceMuted) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      } else {
        this.speak('Озвучка включена');
      }
    }
    return this.voiceMuted;
  }

  public setVoiceMuted(muted: boolean): void {
    this.voiceMuted = muted;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('one8b_voice_muted', String(this.voiceMuted));
      } catch {}
    }
    if (this.voiceMuted && typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  private initVoiceEngine(): void {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !window.speechSynthesis
    ) {
      return;
    }

    const findRussianVoice = () => {
      try {
        if (!window.speechSynthesis) return;
        const voices = window.speechSynthesis.getVoices();
        this.selectedVoice =
          voices.find((v) => v.lang.startsWith('ru') || v.lang === 'ru_RU' || v.lang === 'ru-RU') ||
          null;
      } catch {
        this.selectedVoice = null;
      }
    };

    findRussianVoice();
    try {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = findRussianVoice;
      }
    } catch {}
  }

  public speak(text: string): void {
    if (
      this.voiceMuted ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      !window.speechSynthesis
    ) {
      return;
    }

    const cleanText = (text || '').trim();
    if (!cleanText) return;

    // Safeguard: truncate to safe length (max 500 chars) to prevent Chromium speech queue hang (crbug.com/241838)
    const safeText = cleanText.length > 500 ? cleanText.slice(0, 497) + '...' : cleanText;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(safeText);
      utterance.lang = 'ru-RU';
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error or blocked
    }
  }

  public speakBirth(countryName: string, conditions: string): void {
    const text = `Новая жизнь. Рождение в стране ${countryName}. ${conditions}`;
    this.speak(text);
  }

  public speakMilestone(text: string): void {
    this.speak(`Важное событие. ${text}`);
  }

  public speakDeath(eulogy: string): void {
    this.speak(`Жизненный путь завершен. ${eulogy}`);
  }

  // ==================== PROCEDURAL WEB AUDIO SFX ====================

  // Tactile button / next year click
  public playClick(): void {
    if (this.sfxMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }

  // Year progression tick
  public playTick(): void {
    if (this.sfxMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {}
  }

  // Dramatic heartbeat for low health/danger
  public playHeartbeat(): void {
    if (this.sfxMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.12].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, now + offset);
        osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.08);

        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.linearRampToValueAtTime(0.001, now + offset + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      });
    } catch {}
  }

  // Major milestone / graduation / promotion arpeggio
  public playSuccess(): void {
    if (this.sfxMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime + i * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch {}
  }

  // Crisis / Health drop / Warning thud
  public playWarning(): void {
    if (this.sfxMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const now = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.28);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  // Death / Memorial gentle chime & funeral bell
  public playGameOver(): void {
    if (this.sfxMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      // Deep resonant bell chord
      const chord = [220.0, 261.63, 329.63, 440.0]; // A minor bell harmonics
      chord.forEach((freq, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(idx === 0 ? 0.22 : 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.2);
      });
    } catch {}
  }

  // PROJECT.md Contract: play(event: 'click' | 'step' | 'milestone' | 'crisis' | 'death')
  public play(event: SoundEvent): void {
    switch (event) {
      case 'click':
        this.playClick();
        break;
      case 'step':
        this.playTick();
        break;
      case 'heartbeat':
        this.playHeartbeat();
        break;
      case 'milestone':
        this.playSuccess();
        break;
      case 'crisis':
        this.playWarning();
        break;
      case 'death':
        this.playGameOver();
        break;
      default:
        this.playClick();
    }
  }
}

export const soundEngine = new SoundEngine();
export const sound = soundEngine;
