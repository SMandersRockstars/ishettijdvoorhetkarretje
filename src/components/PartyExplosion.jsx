import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTime } from '../contexts/TimeContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { playPartyFanfare } from '../utils/partySound';
import '../styles/party-explosion.css';

const TOTAL_MS = 5600;
const SHAKE_MS = 2600;
const CONFETTI_COUNT = 110;
const BOTTLE_COUNT = 22;

const CONFETTI_COLORS = [
  '#ffd700',
  '#ff2d2d',
  '#2dff6a',
  '#00e5ff',
  '#ff00e5',
  '#ff8a00',
  '#ffffff',
];

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeConfetti(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = rand(0, Math.PI * 2);
    const dist = rand(120, Math.max(window.innerWidth, window.innerHeight) * 0.75);
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.7,
      spin: rand(-1080, 1080),
      dur: rand(1.8, 3.4),
      delay: rand(0.1, 1.1),
      w: rand(8, 20),
      h: rand(12, 30),
      color: pick(CONFETTI_COLORS),
      round: Math.random() < 0.25,
    };
  });
}

function makeBottles(count, images) {
  const srcs = images && images.length ? images : ['assets/kar.png'];
  return Array.from({ length: count }, (_, i) => {
    const angle = rand(0, Math.PI * 2);
    const dist = rand(200, Math.max(window.innerWidth, window.innerHeight) * 0.9);
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.8,
      spin: rand(-1440, 1440),
      dur: rand(2.4, 3.8),
      delay: rand(0.2, 1.4),
      size: rand(48, 120),
      src: pick(srcs),
    };
  });
}

/**
 * The moment it becomes tijd voor het karretje, the whole office deserves more
 * than a background colour swap. When `isPartyTime` flips false → true this
 * takes over the entire viewport for a few seconds: strobe lights, an earthquake,
 * a shockwave, a full-cart fly-by, beer/bier-snacks shrapnel, confetti and a
 * synthesised siren-into-fanfare.
 *
 * Only the transition triggers the automatic run — loading the page already in
 * party time is calm. Dismissable with a click or Escape. The automatic run is
 * skipped for prefers-reduced-motion.
 *
 * A manual re-trigger is always available: dispatch `karretje-boom` on `window`
 * (Shift+K does this, see App.jsx). Manual booms ignore both the clock and
 * prefers-reduced-motion, because the user explicitly asked for the explosion.
 */
export const BOOM_EVENT = 'karretje-boom';

export function PartyExplosion() {
  const { isPartyTime } = useTime();
  const { theme, initialized, setDucked } = useTheme();
  const reducedMotion = usePrefersReducedMotion();

  const [runId, setRunId] = useState(0);
  const [running, setRunning] = useState(false);
  const prevParty = useRef(isPartyTime);
  // When a manual boom just fired, suppress the automatic one caused by the same
  // Shift+K press flipping isPartyTime false -> true. Otherwise the confetti gets
  // regenerated twice in one frame.
  const lastManualBoomAt = useRef(0);

  const boom = useCallback((source) => {
    if (source === 'manual') lastManualBoomAt.current = Date.now();
    setRunId((id) => id + 1);
    setRunning(true);
  }, []);

  // Fire only on the actual flip, never on mount.
  useEffect(() => {
    const wasParty = prevParty.current;
    prevParty.current = isPartyTime;
    if (reducedMotion || wasParty || !isPartyTime) return;
    if (Date.now() - lastManualBoomAt.current < 1000) return;
    boom('auto');
  }, [isPartyTime, reducedMotion, boom]);

  // Manual re-trigger: works any day, any hour, even while already party time.
  useEffect(() => {
    const onManualBoom = () => boom('manual');
    window.addEventListener(BOOM_EVENT, onManualBoom);
    return () => window.removeEventListener(BOOM_EVENT, onManualBoom);
  }, [boom]);

  const dismiss = useCallback(() => setRunning(false), []);

  const confetti = useMemo(() => makeConfetti(CONFETTI_COUNT), [runId]);
  const bottles = useMemo(() => makeBottles(BOTTLE_COUNT, theme.partyImages), [runId, theme.partyImages]);

  // Earthquake the app, hand the speakers over to the fanfare, then clean up.
  useEffect(() => {
    if (!running) return undefined;

    const root = document.getElementById('root');
    if (root) {
      // Cleanup and this effect run back-to-back without a style recalc between
      // them, so a bare add/remove would not restart a running shake. The reflow
      // read forces the browser to flush the removal before we re-apply it.
      root.classList.remove('party-earthquake');
      void root.offsetWidth;
      root.classList.add('party-earthquake');
    }
    setDucked(true);
    if (initialized) playPartyFanfare();

    const shakeTimer = setTimeout(() => root?.classList.remove('party-earthquake'), SHAKE_MS);
    const endTimer = setTimeout(() => setRunning(false), TOTAL_MS);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(endTimer);
      root?.classList.remove('party-earthquake');
      setDucked(false);
    };
    // runId in deps so a re-trigger restarts the earthquake + fanfare from zero
    // instead of finishing the previous run's timers.
  }, [running, runId, initialized, setDucked]);

  // Escape hatch for anyone who wants their screen back early.
  useEffect(() => {
    if (!running) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [running, dismiss]);

  if (!running) return null;

  return (
    <div
      className="party-boom"
      onClick={dismiss}
      role="presentation"
      aria-live="assertive"
      title="Klik om te dismissen"
    >
      <div className="party-boom-backdrop" />
      <div className="party-boom-strobe" />

      {[0, 0.25, 0.5].map((delay) => (
        <span key={`ring-${runId}-${delay}`} className="party-boom-ring" style={{ '--delay': `${delay}s` }} />
      ))}

      {confetti.map((c) => (
        <span
          key={`c-${runId}-${c.id}`}
          className={`party-confetti${c.round ? ' party-confetti--round' : ''}`}
          style={{
            '--x': `${c.x}px`,
            '--y': `${c.y}px`,
            '--spin': `${c.spin}deg`,
            '--dur': `${c.dur}s`,
            '--delay': `${c.delay}s`,
            width: `${c.w}px`,
            height: `${c.h}px`,
            background: c.color,
          }}
        />
      ))}

      {bottles.map((b) => (
        <img
          key={`b-${runId}-${b.id}`}
          className="party-shrapnel"
          src={b.src}
          alt=""
          style={{
            '--x': `${b.x}px`,
            '--y': `${b.y}px`,
            '--spin': `${b.spin}deg`,
            '--dur': `${b.dur}s`,
            '--delay': `${b.delay}s`,
            width: `${b.size}px`,
          }}
        />
      ))}

      <img key={`cart-${runId}`} className="party-boom-cart" src={theme.fullCart} alt="" />

      <h1 key={`text-${runId}`} className="party-boom-text">
        <span className="party-boom-line">HET IS TIJD</span>
        <span className="party-boom-line party-boom-line--big">VOOR HET KARRETJE!!!</span>
        <span className="party-boom-beers">🍺🍻🍺🍻🍺</span>
      </h1>
    </div>
  );
}
