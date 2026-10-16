import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useEngineSound } from '../hooks/useEngineSound';
import { PullScene } from './PullScene';
import {
  TRACK_M,
  REDLINE_RPM,
  IDLE_RPM,
  TRACK_CONDITIONS,
  createSimState,
  stepSim,
  sledResistance,
  scoreRun,
  resultFor,
} from '../utils/pullSim';
import '../styles/pull-game.css';

const HS_KEY = 'karretje-full-pull-highscore';
const CLUTCH_KEYS = ['KeyA', 'ArrowLeft'];
const GAS_KEYS = ['KeyL', 'ArrowRight'];

const readHigh = () => {
  try {
    return Number(localStorage.getItem(HS_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeHigh = (v) => {
  try {
    localStorage.setItem(HS_KEY, String(v));
  } catch {
    /* private mode, fine */
  }
};

function snapshot(s) {
  return {
    status: s.status,
    rpm: s.rpm,
    distance: s.distance,
    v: s.v,
    slip: s.slip,
    tireHealth: s.tireHealth,
    noseAngle: s.noseAngle,
    wheelAngle: s.wheelAngle,
    elapsed: s.elapsed,
    maxSlip: s.maxSlip,
    maxNose: s.maxNose,
    clutchLocked: s.clutchLocked,
    driveForce: s.driveForce,
    tractionForce: s.tractionForce,
    sledN: sledResistance(s),
    ceilingN: s.gripCeilingN,
    condition: s.condition,
    gas: s.gas,
    clutchPedal: s.clutchPedal,
  };
}

function randomCondition() {
  return TRACK_CONDITIONS[Math.floor(Math.random() * TRACK_CONDITIONS.length)];
}

function Bar({ value, max, segments = 28, className = '', label, dangerBelow = null }) {
  const filled = Math.max(0, Math.min(1, value / max));
  const cells = [];
  for (let i = 0; i < segments; i += 1) {
    const on = i / segments < filled;
    const ratio = i / (segments - 1);
    // For a resource gauge (tyres) a short bar is the bad case, so the colour has
    // to follow the level, not the position.
    const danger = dangerBelow !== null && value <= dangerBelow;
    cells.push(
      <span
        key={i}
        className={[
          'pull-cell',
          on ? 'on' : '',
          !danger && ratio > 0.88 ? 'redline' : '',
          !danger && ratio > 0.68 && ratio <= 0.88 ? 'warn' : '',
          danger && on ? 'danger' : '',
        ].join(' ')}
      />,
    );
  }
  return (
    <div className={`pull-gauge ${className}`}>
      {label ? <span className="pull-gauge-label">{label}</span> : null}
      <span className="pull-cells">{cells}</span>
    </div>
  );
}

function Pedal({ name, value, hint }) {
  return (
    <div className="pull-pedal">
      <div className="pull-pedal-track">
        <div className="pull-pedal-fill" style={{ height: `${Math.round(value * 100)}%` }} />
      </div>
      <div className="pull-pedal-name">{name}</div>
      <div className="pull-pedal-hint">{hint}</div>
    </div>
  );
}

// Load gauge with the grip ceiling marked, so you can see the sled pass the point
// where the ground can no longer help you.
function LoadGauge({ loadN, ceilingN }) {
  const max = ceilingN * 1.35;
  const segments = 28;
  const filled = Math.max(0, Math.min(1, loadN / max));
  const ceilAt = ceilingN / max;
  const over = loadN > ceilingN;
  const cells = [];
  for (let i = 0; i < segments; i += 1) {
    const on = i / segments < filled;
    cells.push(
      <span
        key={i}
        className={`pull-cell ${on ? 'on' : ''} ${on && over ? 'danger' : ''}`}
      />,
    );
  }
  return (
    <div className="pull-gauge pull-gauge-load">
      <span className="pull-gauge-label">LOAD</span>
      <span className="pull-cells">
        {cells}
        <span className="pull-ceiling-mark" style={{ left: `${ceilAt * 100}%` }} title="grip ceiling" />
      </span>
      <span className={`pull-load-value ${over ? 'is-over' : ''}`}>
        {(loadN / 1000).toFixed(1)} kN
      </span>
    </div>
  );
}

function Hud({ snap }) {
  const kmh = snap.v * 3.6;
  const lugging = snap.clutchLocked && snap.rpm < 1100 && snap.gas > 0.4;
  return (
    <div className="pull-hud">
      <div className="pull-hud-top">
        <div className="pull-readout pull-readout-big">
          <span className="pull-readout-value">{snap.distance.toFixed(1)}</span>
          <span className="pull-readout-unit">m</span>
        </div>
        <div className="pull-readout">
          <span className="pull-readout-value">{kmh.toFixed(1)}</span>
          <span className="pull-readout-unit">km/h</span>
        </div>
        <div className="pull-readout">
          <span className="pull-readout-value">{Math.round(snap.rpm)}</span>
          <span className="pull-readout-unit">rpm</span>
        </div>
        <div className="pull-condition">{snap.condition.label}</div>
      </div>

      <div className="pull-gauges">
        <Bar value={snap.rpm} max={3200} label="RPM" className="pull-tacho" />
        <LoadGauge loadN={snap.sledN} ceilingN={snap.ceilingN} />
        <Bar value={snap.distance} max={TRACK_M} label="DISTANCE" />
        <Bar value={snap.tireHealth} max={1} label="TYRES" className="pull-tyres" dangerBelow={0.34} />
      </div>

      {snap.slip > 0.25 ? <div className="pull-alert pull-alert-spin">🔥 WHEELSPIN!</div> : null}
      {snap.rpm > REDLINE_RPM ? <div className="pull-alert pull-alert-rev">⚠️ OVER-REV!</div> : null}
      {snap.sledN > snap.ceilingN ? (
        <div className="pull-alert pull-alert-load">⚓ LOAD EXCEEDS GRIP</div>
      ) : null}
      {lugging ? <div className="pull-alert pull-alert-lug">⛽ ENGINE LUGGING</div> : null}
      {snap.distance < 0.5 && snap.gas > 0.6 && snap.clutchPedal > 0.7 ? (
        <div className="pull-coach">⬆ RELEASE A SLOWLY — FEEL IT BITE ⬆</div>
      ) : null}
    </div>
  );
}

function ReadyScreen({ condition, highScore, onStart, onClose }) {
  return (
    <div className="pull-screen">
      <div className="pull-title">FULL PULL</div>
      <div className="pull-subtitle">
        Drag the cart 100 metres down the track. Without shredding the tyres. Without stalling.
      </div>
      <div className="pull-conditions">
        <div className="pull-conditions-row">
          <kbd>A</kbd> / <kbd>←</kbd> clutch — hold to disengage
        </div>
        <div className="pull-conditions-row">
          <kbd>L</kbd> / <kbd>→</kbd> throttle — hold to open up
        </div>
        <div className="pull-conditions-row">
          <kbd>Esc</kbd> close &nbsp;·&nbsp; <kbd>Space</kbd> start
        </div>
      </div>
      <div className="pull-howto">
        <p>
          1. Hold <kbd>A</kbd> and pin the throttle. Let the engine build revs.
        </p>
        <p>
          2. Let <kbd>A</kbd> up <em>slowly</em>. Feel it bite. Too fast = broken engine. Too
          slow = you go nowhere.
        </p>
        <p>3. Ride the edge of the grip. No smoke. No stalling. Just pull.</p>
      </div>
      <div className="pull-condition-tag">TRACK: {condition.label}</div>
      {highScore > 0 ? <div className="pull-highscore">HIGH SCORE: {highScore.toLocaleString()}</div> : null}
      <button className="pull-btn pull-btn-start" onClick={onStart}>
        START PULL
      </button>
      <button className="pull-btn pull-btn-ghost" onClick={onClose}>
        back
      </button>
    </div>
  );
}

function DoneScreen({ snap, score, bonuses, highScore, isNewHigh, onRestart, onClose }) {
  const result = resultFor(snap);
  return (
    <div className="pull-screen">
      <div className="pull-result-title" style={{ color: result.color }}>
        {result.title}
      </div>
      <div className="pull-result-distance">{snap.distance.toFixed(1)} m</div>
      <div className="pull-result-score">{score.toLocaleString()} pts</div>
      {bonuses.length ? (
        <div className="pull-bonuses">
          {bonuses.map((b) => (
            <div key={b} className="pull-bonus">
              {b}
            </div>
          ))}
        </div>
      ) : null}
      <div className="pull-result-stats">
        <span>max slip {Math.round(snap.maxSlip * 100)}%</span>
        <span>nose {Math.round(snap.maxNose)}°</span>
        <span>{snap.elapsed.toFixed(1)}s</span>
        <span>tyres {Math.round(snap.tireHealth * 100)}%</span>
      </div>
      {isNewHigh ? <div className="pull-newhigh">NEW HIGH SCORE</div> : (
        <div className="pull-highscore">HIGH SCORE: {highScore.toLocaleString()}</div>
      )}
      <button className="pull-btn pull-btn-start" onClick={onRestart}>
        PULL AGAIN
      </button>
      <button className="pull-btn pull-btn-ghost" onClick={onClose}>
        back
      </button>
    </div>
  );
}

export function PullOverlay() {
  const { initialized } = useTheme();
  const reduced = usePrefersReducedMotion();
  const sound = useEngineSound();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [condition, setCondition] = useState(() => randomCondition());
  const [snap, setSnap] = useState(() => snapshot(createSimState(condition)));
  const [result, setResult] = useState({ score: 0, bonuses: [] });
  const [highScore, setHighScore] = useState(readHigh);

  const simRef = useRef(null);
  const inputRef = useRef({ clutch: true, gas: false });
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const wasLockedRef = useRef(false);
  const soundOnRef = useRef(false);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const closeAll = useCallback(() => {
    stopLoop();
    if (soundOnRef.current) {
      sound.stop();
      soundOnRef.current = false;
    }
    setOpen(false);
    setPhase('ready');
  }, [sound, stopLoop]);

  const finishRun = useCallback(
    (s) => {
      stopLoop();
      if (soundOnRef.current) {
        sound.stop();
        soundOnRef.current = false;
      }
      const { score, bonuses } = scoreRun(s);
      if (s.status === 'blown') sound.playBlow();
      else if (s.status === 'stalled') sound.playStall();
      else if (s.status === 'finished') sound.playFinish();
      setResult({ score, bonuses });
      setHighScore((prev) => {
        if (score > prev) {
          writeHigh(score);
          return score;
        }
        return prev;
      });
      setPhase('done');
    },
    [sound, stopLoop],
  );

  const tick = useCallback(
    (now) => {
      const s = simRef.current;
      if (!s) return;
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 1 / 60;
      lastRef.current = now;

      const inp = inputRef.current;
      stepSim(s, { gas: inp.gas ? 1 : 0, clutchPedal: inp.clutch ? 1 : 0 }, dt);

      if (soundOnRef.current) {
        sound.update({ rpm: s.rpm, gas: s.gas, slip: s.slip });
        if (s.clutchLocked && !wasLockedRef.current) sound.playHookup();
      }
      wasLockedRef.current = s.clutchLocked;

      setSnap(snapshot(s));

      if (s.status !== 'pulling') {
        finishRun(s);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [finishRun, sound],
  );

  const startRun = useCallback(() => {
    stopLoop();
    const s = createSimState(condition);
    s.status = 'pulling';
    simRef.current = s;
    inputRef.current = { clutch: true, gas: false };
    wasLockedRef.current = false;
    lastRef.current = 0;
    setSnap(snapshot(s));
    setResult({ score: 0, bonuses: [] });
    setPhase('running');
    if (initialized && !soundOnRef.current) {
      sound.start();
      soundOnRef.current = true;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [condition, initialized, sound, stopLoop, tick]);

  const openOverlay = useCallback(() => {
    setCondition(randomCondition());
    setPhase('ready');
    setOpen(true);
  }, []);

  // keyboard
  useEffect(() => {
    if (!open) return undefined;
    const isTyping = () => {
      const t = document.activeElement?.tagName;
      return t === 'INPUT' || t === 'TEXTAREA';
    };
    const onDown = (e) => {
      if (isTyping()) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        closeAll();
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (phase !== 'running') startRun();
        return;
      }
      if (CLUTCH_KEYS.includes(e.code)) {
        e.preventDefault();
        inputRef.current.clutch = true;
      }
      if (GAS_KEYS.includes(e.code)) {
        e.preventDefault();
        inputRef.current.gas = true;
      }
    };
    const onUp = (e) => {
      if (CLUTCH_KEYS.includes(e.code)) inputRef.current.clutch = false;
      if (GAS_KEYS.includes(e.code)) inputRef.current.gas = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [open, phase, startRun, closeAll]);

  // never leave a loop or a context running behind us
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (soundOnRef.current) sound.stop();
  }, [sound]);

  const lugging = snap.clutchLocked && snap.rpm < 1100 && snap.gas > 0.4;
  const load01 = Math.min(1, snap.sledN / Math.max(snap.ceilingN * 1.25, 1));
  const shake = !reduced && phase === 'running' && (snap.slip > 0.35 || snap.rpm > REDLINE_RPM);

  return (
    <>
      {!open ? (
        <button className="pull-open-btn" onClick={openOverlay} title="Tractor pull">
          <span className="pull-open-emoji">🚜</span>
          <span className="pull-open-text">FULL PULL</span>
        </button>
      ) : null}

      {open ? (
        <div className={`pull-overlay ${shake ? 'is-shaking' : ''}`}>
          <PullScene
            wheelAngle={snap.wheelAngle}
            noseAngle={snap.noseAngle}
            distance={snap.distance}
            slip={snap.slip}
            lugging={lugging}
            load01={load01}
            condition={condition}
            reducedMotion={reduced}
          />

          {phase === 'running' ? <Hud snap={snap} /> : null}

          {phase === 'running' ? (
            <div className="pull-pedals">
              <Pedal name="KOPPELING" value={snap.clutchPedal} hint="A / ←" />
              <Pedal name="GAS" value={snap.gas} hint="L / →" />
            </div>
          ) : null}

          {phase === 'ready' ? (
            <ReadyScreen
              condition={condition}
              highScore={highScore}
              onStart={startRun}
              onClose={closeAll}
            />
          ) : null}

          {phase === 'done' ? (
            <DoneScreen
              snap={snap}
              score={result.score}
              bonuses={result.bonuses}
              highScore={highScore}
              isNewHigh={result.score >= highScore && result.score > 0}
              onRestart={startRun}
              onClose={closeAll}
            />
          ) : null}

          <button className="pull-close-x" onClick={closeAll} aria-label="sluiten">
            ✕
          </button>
        </div>
      ) : null}
    </>
  );
}
