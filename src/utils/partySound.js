// WebAudio fanfare for the moment it becomes tijd voor het karretje.
// Air-raid siren sweeps into a brass-style fanfare into a sustained chord.
// Everything is synthesised so there is no extra asset to ship.

const AudioCtx =
  typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;

function tone(ctx, start, freq, dur, type = 'square', vol = 0.15, endFreq = null) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq !== null) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  }
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.start(start);
  osc.stop(start + dur);
}

// Short filtered-noise burst — used as a drum/impact hit.
function thump(ctx, start, dur = 0.18, vol = 0.22) {
  const frames = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, start);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(start);
  src.stop(start + dur);
}

export const PARTY_FANFARE_MS = 5200;

export function playPartyFanfare() {
  if (!AudioCtx) return;
  let ctx;
  try {
    ctx = new AudioCtx();
  } catch {
    return;
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const t0 = ctx.currentTime + 0.05;

  // 1. Air-raid siren: three rising/falling sweeps
  for (let i = 0; i < 3; i += 1) {
    const s = t0 + i * 0.5;
    tone(ctx, s, 300, 0.28, 'sawtooth', 0.11, 820);
    tone(ctx, s + 0.26, 820, 0.24, 'sawtooth', 0.09, 340);
  }

  // 2. Brass fanfare: rising arpeggio, twice, second time higher
  const fanfare = [523.25, 523.25, 659.25, 783.99];
  fanfare.forEach((f, i) => {
    tone(ctx, t0 + 1.55 + i * 0.15, f, 0.26, 'square', 0.13);
  });
  fanfare.forEach((f, i) => {
    tone(ctx, t0 + 2.25 + i * 0.13, f * 1.5, 0.24, 'square', 0.11);
  });

  // 3. Impacts
  thump(ctx, t0 + 1.5, 0.22, 0.25);
  thump(ctx, t0 + 2.2, 0.22, 0.22);
  thump(ctx, t0 + 2.85, 0.5, 0.3);

  // 4. Sustained triumphant chord with a slow detuned wobble
  const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
  chord.forEach((f) => {
    tone(ctx, t0 + 2.9, f, 1.9, 'sawtooth', 0.055);
    tone(ctx, t0 + 2.92, f * 1.005, 1.85, 'triangle', 0.045);
  });

  setTimeout(() => ctx.close().catch(() => {}), PARTY_FANFARE_MS);
}
