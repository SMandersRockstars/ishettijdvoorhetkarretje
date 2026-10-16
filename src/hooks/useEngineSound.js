import { useCallback, useMemo, useRef } from 'react';

// Sustained engine audio. The existing useGameSounds hook builds a fresh
// AudioContext per blip, which is fine for a quack but useless for an engine that
// has to drone, growl and scream continuously across a pull. So this keeps one
// context alive for the whole run and just moves parameters around it.

const AudioCtx =
  typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;

function makeNoiseBuffer(ctx, seconds = 2) {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function makeDistortionCurve(amount) {
  const k = amount;
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export function useEngineSound() {
  const n = useRef(null); // node bundle for the live run

  const start = useCallback(() => {
    if (!AudioCtx || n.current) return;
    let ctx;
    try {
      ctx = new AudioCtx();
    } catch {
      return;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 8;
    master.connect(comp);
    comp.connect(ctx.destination);

    // --- engine block: three oscillators through a lowpass + grit ---
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 4;

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(12);

    const engineGain = ctx.createGain();
    engineGain.gain.value = 0.4;

    filter.connect(shaper);
    shaper.connect(engineGain);
    engineGain.connect(master);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    const osc3 = ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.detune.value = 17;

    const g1 = ctx.createGain();
    g1.gain.value = 0.6;
    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    const g3 = ctx.createGain();
    g3.gain.value = 0.4;

    osc1.connect(g1).connect(filter);
    osc2.connect(g2).connect(filter);
    osc3.connect(g3).connect(filter);

    // --- wheelspin: looping noise through a bandpass ---
    const spinGain = ctx.createGain();
    spinGain.gain.value = 0;
    const spinFilter = ctx.createBiquadFilter();
    spinFilter.type = 'bandpass';
    spinFilter.frequency.value = 800;
    spinFilter.Q.value = 0.7;
    const spinSrc = ctx.createBufferSource();
    spinSrc.buffer = makeNoiseBuffer(ctx);
    spinSrc.loop = true;
    spinSrc.connect(spinFilter).connect(spinGain).connect(master);

    osc1.start();
    osc2.start();
    osc3.start();
    spinSrc.start();

    n.current = {
      ctx,
      master,
      filter,
      engineGain,
      spinGain,
      spinFilter,
      osc1,
      osc2,
      osc3,
      spinSrc,
    };
  }, []);

  // rpm/gas/slip -> timbre. setTargetAtTime keeps it from stepping.
  const update = useCallback(({ rpm = 800, gas = 0, slip = 0 } = {}) => {
    const b = n.current;
    if (!b) return;
    const t = b.ctx.currentTime;
    // firing frequency of a four-cylinder diesel, pushed up an octave or two so it
    // lands in a audible, angry range
    const f = Math.max(24, (rpm / 60) * 4);
    b.osc1.frequency.setTargetAtTime(f, t, 0.02);
    b.osc2.frequency.setTargetAtTime(f * 1.5, t, 0.02);
    b.osc3.frequency.setTargetAtTime(f * 0.5, t, 0.02);
    b.filter.frequency.setTargetAtTime(260 + gas * 1500 + rpm * 0.22, t, 0.03);
    b.engineGain.gain.setTargetAtTime(0.22 + gas * 0.45, t, 0.05);
    b.spinGain.gain.setTargetAtTime(Math.min(0.4, slip * 0.42), t, 0.03);
    b.spinFilter.frequency.setTargetAtTime(600 + slip * 1500, t, 0.05);
    b.master.gain.setTargetAtTime(1, t, 0.06);
  }, []);

  const stop = useCallback(() => {
    const b = n.current;
    if (!b) return;
    n.current = null;
    const t = b.ctx.currentTime;
    b.master.gain.cancelScheduledValues(t);
    b.master.gain.setTargetAtTime(0, t, 0.05);
    window.setTimeout(() => {
      try {
        b.osc1.stop();
        b.osc2.stop();
        b.osc3.stop();
        b.spinSrc.stop();
      } catch {
        /* already stopped */
      }
      b.ctx.close().catch(() => {});
    }, 350);
  }, []);

  // One-shots ride on whatever context is live; if none is, they make their own.
  const blip = useCallback((build) => {
    if (!AudioCtx) return;
    let ctx;
    try {
      ctx = new AudioCtx();
    } catch {
      return;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    build(ctx);
    window.setTimeout(() => ctx.close().catch(() => {}), 2000);
  }, []);

  const playBlow = useCallback(() => {
    blip((ctx) => {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx, 1.6);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(2400, t);
      f.frequency.exponentialRampToValueAtTime(90, t + 1.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
      src.stop(t + 1.6);
    });
  }, [blip]);

  const playStall = useCallback(() => {
    blip((ctx) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(28, t + 0.9);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 1);
    });
  }, [blip]);

  const playHookup = useCallback(() => {
    blip((ctx) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(220, t + 0.18);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  }, [blip]);

  const playFinish = useCallback(() => {
    blip((ctx) => {
      const t = ctx.currentTime;
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.16, t + i * 0.11);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.11 + 0.4);
        o.connect(g).connect(ctx.destination);
        o.start(t + i * 0.11);
        o.stop(t + i * 0.11 + 0.45);
      });
    });
  }, [blip]);

  return useMemo(
    () => ({
      start,
      update,
      stop,
      playBlow,
      playStall,
      playHookup,
      playFinish,
    }),
    [start, update, stop, playBlow, playStall, playHookup, playFinish],
  );
}
