import { useCallback } from 'react';

const AudioCtx = typeof window !== 'undefined'
  ? window.AudioContext || window.webkitAudioContext
  : null;

function playTone(ctx, startTime, freq, dur, type = 'square', volume = 0.18) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
  osc.start(startTime);
  osc.stop(startTime + dur);
}

export function useGameSounds() {
  const playHit = useCallback(() => {
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    playTone(ctx, ctx.currentTime, 900, 0.045);
    playTone(ctx, ctx.currentTime + 0.06, 680, 0.04);
    setTimeout(() => ctx.close(), 600);
  }, []);

  const playMiss = useCallback(() => {
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  }, []);

  const playCombo = useCallback((comboCount) => {
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const baseFreq = 500 + comboCount * 100;
    playTone(ctx, ctx.currentTime, baseFreq, 0.08, 'square', 0.12);
    playTone(ctx, ctx.currentTime + 0.08, baseFreq * 1.25, 0.08, 'square', 0.1);
    setTimeout(() => ctx.close(), 400);
  }, []);

  const playRoundStart = useCallback(() => {
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    playTone(ctx, ctx.currentTime, 523, 0.12, 'square', 0.15);
    playTone(ctx, ctx.currentTime + 0.12, 659, 0.12, 'square', 0.15);
    playTone(ctx, ctx.currentTime + 0.24, 784, 0.2, 'square', 0.15);
    setTimeout(() => ctx.close(), 600);
  }, []);

  const playGameOver = useCallback(() => {
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    playTone(ctx, ctx.currentTime, 400, 0.2, 'sawtooth', 0.12);
    playTone(ctx, ctx.currentTime + 0.2, 350, 0.2, 'sawtooth', 0.12);
    playTone(ctx, ctx.currentTime + 0.4, 300, 0.2, 'sawtooth', 0.12);
    playTone(ctx, ctx.currentTime + 0.6, 200, 0.4, 'sawtooth', 0.1);
    setTimeout(() => ctx.close(), 1200);
  }, []);

  const playPerfectRound = useCallback(() => {
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    playTone(ctx, ctx.currentTime, 523, 0.1, 'square', 0.15);
    playTone(ctx, ctx.currentTime + 0.1, 659, 0.1, 'square', 0.15);
    playTone(ctx, ctx.currentTime + 0.2, 784, 0.1, 'square', 0.15);
    playTone(ctx, ctx.currentTime + 0.3, 1047, 0.3, 'square', 0.18);
    setTimeout(() => ctx.close(), 800);
  }, []);

  return {
    playHit,
    playMiss,
    playCombo,
    playRoundStart,
    playGameOver,
    playPerfectRound,
  };
}
