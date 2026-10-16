/**
 * Pull harness — drives the simulation with scripted inputs and reports what it
 * actually does, so "feels wrong" can be turned into a number.
 *
 *   npm run harness              # everything
 *   npm run harness matrix       # clutch x gas response grid
 *   npm run harness launch       # standstill launch sweep
 *   npm run harness timeline     # per-second dump of a scripted human run
 *   npm run harness monotonic    # inversion hunt
 *
 * Reading the matrix: `a` is m/s^2 at the end of a 2 s probe. A sane tractor
 * pulls HARDER as the clutch pedal comes UP (more engagement). If `a` rises with
 * pedal travel, the drivetrain is inverted.
 */

import {
  TRACK_CONDITIONS,
  TRACK_M,
  IDLE_RPM,
  REDLINE_RPM,
  STALL_RPM,
  WHEEL_R,
  GEAR,
  createSimState,
  stepSim,
  sledResistance,
  gripCeiling,
  sledResistance as sledN,
  SLED_PLOW_K,
  VEHICLE_KG,
} from '../src/utils/pullSim.js';

const DT = 1 / 60;
const byId = (id) => TRACK_CONDITIONS.find((c) => c.id === id);
const DRY = TRACK_CONDITIONS[0];
const WET = byId('wet');
const MUD = byId('mud');

const f = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : String(n));
const pad = (s, w) => String(s).padStart(w);

/** Run a policy and collect per-frame samples. */
function drive(policy, { condition = DRY, seconds = 30, state = null } = {}) {
  const s = state ?? createSimState(condition);
  if (s.status === 'ready') s.status = 'pulling';
  const samples = [];
  let t = 0;
  while (t < seconds && s.status === 'pulling') {
    t += DT;
    stepSim(s, policy(t, s), DT);
    samples.push({ t, s: { ...s } });
  }
  return { s, samples };
}

const RAD2RPM = 60 / (2 * Math.PI);

/**
 * Put the rig into a settled rolling state: clutch locked, engine tied to the
 * wheels, at the requested speed. Everything downstream then starts from the same
 * place, so the probe measures the input and not the setup.
 */
function rollingAt(v, condition = DRY, gas = 1) {
  const s = createSimState(condition);
  s.status = 'pulling';
  s.v = v;
  s.wheelOmega = v / WHEEL_R;
  // Engine tied to the wheels: no slip across the clutch, no fake momentum.
  const tied = (v / WHEEL_R) * GEAR * RAD2RPM;
  // Below the tied idle the engine cannot spin any slower: it lugs instead.
  s.rpm = Math.max(tied, IDLE_RPM * 0.95);
  s.lugging = tied < IDLE_RPM;
  s.clutchLocked = true;
  s.gas = gas;
  s.clutchPedal = 0;

  // Guard: a bad setup used to silently produce garbage numbers (e.g. feeding a
  // rad/s figure into a rpm field injects enough momentum to launch the rig).
  if (!Number.isFinite(s.rpm) || s.rpm > REDLINE_RPM * 1.5 || s.rpm < STALL_RPM * 0.5) {
    throw new Error(`rollingAt: rpm ${s.rpm} absurd for v=${v} (tied=${tied.toFixed(0)})`);
  }

  // settle with the clutch locked and the requested throttle
  let t = 0;
  while (t < 0.5) {
    t += DT;
    stepSim(s, { gas, clutchPedal: 0 }, DT);
  }
  return s;
}

/**
 * Hold one (clutch, gas) pair for `probe` seconds from an identical rolling
 * state and report the change in speed. Positive = sped up.
 */
function probe(clutchPedal, gas, { v = 5, condition = DRY, probeSeconds = 2 } = {}) {
  const s = rollingAt(v, condition, gas);
  const v0 = s.v;
  const d0 = s.distance;
  let t = 0;
  while (t < probeSeconds) {
    t += DT;
    stepSim(s, { gas, clutchPedal }, DT);
  }
  return {
    clutchPedal,
    gas,
    a: (s.v - v0) / probeSeconds,
    dv: s.v - v0,
    v: s.v,
    rpm: s.rpm,
    pull: s.driveForce,
    ceiling: s.tractionForce,
    tire: s.tireHealth,
    slip: s.slip,
    spinning: s.wheelspin,
    locked: s.clutchLocked,
    stalled: s.status === 'stalled',
  };
}

// ------------------------------------------------------------------- matrix

export function matrix({ v = 5, condition = DRY } = {}) {
  const pedals = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const gases = [0.3, 0.6, 1.0];
  console.log(`\n=== RESPONSE MATRIX  ${condition.id}  rolling in at ${v} m/s, held 2 s`);
  console.log('    pedal: 0 = clutch OUT (fully engaged) ... 1 = pedal DOWN (disengaged)\n');
  for (const gas of gases) {
    console.log(`  gas ${f(gas, 1)}`);
    console.log('    pedal      a m/s²     v out    rpm    pull kN   slip  tire  state');
    for (const p of pedals) {
      const r = probe(p, gas, { v, condition });
      const state = r.stalled ? 'STALL' : r.spinning ? 'SPIN' : r.locked ? 'LOCK' : 'SLIP';
      console.log(
        `    ${pad(f(p, 1), 5)}  ${pad(f(r.a), 8)}  ${pad(f(r.v), 7)}  ${pad(f(r.rpm, 0), 6)}` +
          `  ${pad(f(r.pull / 1000, 1), 7)}  ${pad(f(r.slip), 5)}  ${pad(f(r.tire), 4)}  ${state}` +
          `  ceil ${f(r.ceiling / 1000, 1)} kN`,
      );
    }
    // monotonicity: acceleration must not increase as the pedal goes down
    const acc = pedals.map((p) => probe(p, gas, { v, condition }).a);
    let inversions = 0;
    for (let i = 1; i < acc.length; i += 1) {
      if (acc[i] > acc[i - 1] + 0.05) inversions += 1;
    }
    console.log(
      `    -> ${inversions === 0 ? 'OK: more engagement pulls harder' : `INVERTED: ${inversions} step(s) where MORE clutch pedal = MORE acceleration`}\n`,
    );
  }
}

// ------------------------------------------------------------------- launch

export function launch() {
  console.log('\n=== LAUNCH SWEEP  standstill, full gas, varying clutch release');
  console.log('   release   time to move   v@3s   v@6s   max slip   outcome');
  for (const release of [0.5, 1, 2, 3, 5, 8]) {
    const policy = (t) => ({
      gas: 1,
      clutchPedal: t < 0.5 ? 1 : Math.max(0.05, 1 - (t - 0.5) / release),
    });
    const { s, samples } = drive(policy, { condition: DRY, seconds: 12 });
    const at = (sec) => samples.find((x) => x.t >= sec)?.s ?? s;
    const maxSlip = Math.max(...samples.map((x) => x.s.slip), 0);
    const moved = samples.find((x) => x.s.distance > 0.5)?.t ?? Infinity;
    console.log(
      `   ${pad(release, 6)}s   ${pad(moved === Infinity ? 'never' : f(moved, 1) + 's', 10)}` +
        `   ${pad(f(at(3).v), 6)}   ${pad(f(at(6).v), 6)}   ${pad(f(maxSlip), 7)}   ${s.status}`,
    );
  }
}

// ---------------------------------------------------------------- timeline

export function timeline({ condition = DRY } = {}) {
  console.log(`\n=== TIMELINE  ${condition.id}  scripted human: rev, dump clutch, hold full gas`);
  console.log('   t     v m/s   km/u    rpm   pull kN  sled kN  ceil kN  slip  tire  state');
  const policy = (t) => ({
    gas: 1,
    clutchPedal: t < 1.5 ? 1 : Math.max(0.05, 1 - (t - 1.5) / 4),
  });
  const s = createSimState(condition);
  s.status = 'pulling';
  let t = 0;
  let lastSec = -1;
  while (t < 30 && s.status === 'pulling') {
    t += DT;
    stepSim(s, policy(t, s), DT);
    const sec = Math.floor(t);
    if (sec !== lastSec) {
      lastSec = sec;
      console.log(
        `  ${pad(sec, 3)}s  ${pad(f(s.v), 7)}  ${pad(f(s.v * 3.6, 0), 5)}  ${pad(f(s.rpm, 0), 6)}` +
          `   ${pad(f(s.driveForce / 1000, 1), 6)}   ${pad(f(sledResistance(s) / 1000, 1), 6)}` +
          `   ${pad(f(s.gripCeilingN / 1000, 1), 6)}  ${pad(f(s.slip), 5)}  ${pad(f(s.tireHealth), 4)}` +
          `  ${s.clutchLocked ? 'LOCK' : 'slip'}${s.wheelspin ? '+SPIN' : ''}`,
      );
    }
  }
  console.log(`  -> ${s.status} at ${f(s.distance, 1)} m`);
}

// --------------------------------------------------------------- monotonic

export function monotonic() {
  console.log('\n=== MONOTONICITY HUNT  does more clutch pedal ever make you faster?');
  const speeds = [1, 3, 5, 8, 11];
  const gases = [0.4, 0.7, 1.0];
  const conditions = TRACK_CONDITIONS;
  let worst = null;
  let checked = 0;
  for (const condition of conditions) {
    for (const v of speeds) {
      for (const gas of gases) {
        const acc = [0, 0.25, 0.5, 0.75, 1].map(
          (p) => probe(p, gas, { v, condition, probeSeconds: 1.5 }).a,
        );
        checked += 1;
        for (let i = 1; i < acc.length; i += 1) {
          const jump = acc[i] - acc[i - 1];
          if (jump > 0.05 && (!worst || jump > worst.jump)) {
            worst = {
              condition: condition.id,
              v,
              gas,
              from: (i - 1) * 0.25,
              to: i * 0.25,
              jump,
              acc: acc.map((a) => f(a)).join(','),
            };
          }
        }
      }
    }
  }
  console.log(`  ${checked} (condition, speed, gas) combinations checked`);
  if (!worst) {
    console.log('  OK — acceleration never increases with clutch pedal travel.');
  } else {
    console.log(
      `  WORST INVERSION  ${worst.condition} v=${worst.v} gas=${worst.gas}: ` +
        `pedal ${worst.from} -> ${worst.to} gives +${f(worst.jump)} m/s^2`,
    );
    console.log(`    accel by pedal [0,.25,.5,.75,1] = ${worst.acc}`);
  }
}

/**
 * Newton check. Recompute the resistance from the exported model and compare the
 * acceleration the sim actually produced against (pull - resist) / mass. If those
 * disagree, the branch that integrated the state is not the branch the reported
 * forces describe.
 */
export function trace({ condition = MUD, v = 8, gas = 1, pedals = [0, 0.5], seconds = 2 } = {}) {
  const resistOf = (s) =>
    sledN(s) * (1 + SLED_PLOW_K * s.v * s.v) + 0.9 * s.v * s.v;

  for (const pedal of pedals) {
    const s = rollingAt(v, condition, gas);
    console.log(`\n--- TRACE ${condition.id}  clutchPedal=${pedal}  gas=${gas}  v0=${f(s.v)}`);
    console.log(
      '    t      v      real a   expect a    pull kN  resist kN   net kN   state',
    );
    let t = 0;
    let prevV = s.v;
    let prevLocked = s.clutchLocked;
    let last = -1;
    let worst = 0;
    let worstSmooth = 0;
    while (t < seconds && s.status === 'pulling') {
      t += DT;
      stepSim(s, { gas, clutchPedal: pedal }, DT);
      const r = resistOf(s);
      const realA = (s.v - prevV) / DT;
      const expA = (s.driveForce - r) / VEHICLE_KG;
      const err = Math.abs(realA - expA);
      worst = Math.max(worst, err);
      // A clutch catch is an impulse: the drivetrain snaps taut and v legitimately
      // jumps. Only flag disagreement on smooth, non-impulsive substeps.
      const impulse = s.clutchLocked !== prevLocked;
      if (!impulse) worstSmooth = Math.max(worstSmooth, err);
      prevV = s.v;
      prevLocked = s.clutchLocked;
      const q = Math.round(t * 5) / 5;
      if (q !== last) {
        last = q;
        console.log(
          `  ${pad(f(t, 2), 5)}  ${pad(f(s.v), 6)}  ${pad(f(realA), 8)}  ${pad(f(expA), 9)}` +
            `   ${pad(f(s.driveForce / 1000, 2), 7)}   ${pad(f(r / 1000, 2), 8)}` +
            `   ${pad(f((s.driveForce - r) / 1000, 2), 7)}   ` +
            `${s.clutchLocked ? 'LOCK' : 'slip'}${s.wheelspin ? '+SPIN' : ''} slip=${f(s.slip)}`,
        );
      }
    }
    console.log(
      `  -> ${s.status} at ${f(s.distance, 1)} m | worst a error ${f(worst)} m/s^2` +
        ` | excluding clutch-catch impulses ${f(worstSmooth)} m/s^2` +
        (worstSmooth > 0.5 ? '   <<< SIM AND REPORTED FORCES DISAGREE' : '   (consistent)'),
    );
  }
}

// ------------------------------------------------------------------- main

const what = process.argv[2] ?? 'all';
const run = (name, fn) => {
  if (what === 'all' || what === name) fn();
};

run('matrix', () => {
  matrix({ v: 5, condition: DRY });
  matrix({ v: 5, condition: MUD });
  matrix({ v: 10, condition: DRY });
});
run('launch', launch);
run('timeline', () => {
  timeline({ condition: DRY });
  timeline({ condition: MUD });
});
run('monotonic', monotonic);
run('trace', () => {
  for (const c of TRACK_CONDITIONS) {
    for (const v of [2, 6, 10]) {
      trace({ condition: c, v, gas: 1, pedals: [0, 0.25, 0.5, 0.75, 1] });
    }
  }
});
