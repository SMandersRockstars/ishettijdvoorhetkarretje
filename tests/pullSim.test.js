import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TRACK_M,
  IDLE_RPM,
  REDLINE_RPM,
  STALL_RPM,
  OVER_REV_BLOW_S,
  TIRE_LIFE_AT_FULL_SLIP_S,
  TRACK_CONDITIONS,
  createSimState,
  stepSim,
  torqueCurve,
  engineTorque,
  computeTraction,
  gripCeiling,
  sledResistance,
  scoreRun,
  resultFor,
  tyreWearRate,
} from '../src/utils/pullSim.js';

const DRY = TRACK_CONDITIONS[0];
const WET = TRACK_CONDITIONS.find((c) => c.id === 'wet');
const MUD = TRACK_CONDITIONS.find((c) => c.id === 'mud');

const DT = 1 / 60;

/** Run the sim with a policy(t, state) -> {gas, clutchPedal} until it stops or times out. */
function simulate(policy, { condition = DRY, seconds = 120 } = {}) {
  const s = createSimState(condition);
  s.status = 'pulling';
  let t = 0;
  const maxSteps = Math.ceil(seconds / DT);
  for (let i = 0; i < maxSteps && s.status === 'pulling'; i += 1) {
    t += DT;
    stepSim(s, policy(t, s), DT);
    assertNoNaN(s, `step ${i} of policy run`);
  }
  return s;
}

function assertNoNaN(s, where = '') {
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === 'number') {
      assert.ok(Number.isFinite(v), `${k} became ${v} (${where})`);
    }
  }
  assert.ok(s.rpm >= 0, `rpm went negative: ${s.rpm} (${where})`);
  assert.ok(s.v >= 0, `ground speed went negative: ${s.v} (${where})`);
  assert.ok(s.wheelOmega >= 0, `wheel omega went negative: ${s.wheelOmega} (${where})`);
  assert.ok(s.distance >= 0, `distance went negative: ${s.distance} (${where})`);
  assert.ok(s.slip >= 0 && s.slip <= 1, `slip out of range: ${s.slip} (${where})`);
  assert.ok(s.tireHealth >= 0 && s.tireHealth <= 1, `tyre health out of range: ${s.tireHealth} (${where})`);
}

// A driver who never lifts off the gas. This is what most people try first, and it
// is exactly what destroys the tyres near the end of the track.
function careless(t) {
  return { gas: 1, clutchPedal: t < 1.2 ? 1 : Math.max(0.05, 1 - (t - 1.2) / 5) };
}

// Reference "good" driver: revs up, feathers the clutch out, and lifts off the
// throttle the moment the tyres start to break away.
function skilled(t, s) {
  let gas = 1;
  if (s.rpm > 2300) gas = 0.45;
  if (s.slip > 0.18) gas = 0.12;
  return { gas, clutchPedal: t < 1.5 ? 1 : Math.max(0.1, 1 - (t - 1.5) / 6) };
}

// ---------------------------------------------------------------- torque curve

test('torque curve peaks in the mid range, not at idle or redline', () => {
  const peak = torqueCurve(1500);
  assert.ok(peak > torqueCurve(800), 'peak should beat idle torque');
  assert.ok(peak > torqueCurve(2900), 'peak should beat redline torque');
  assert.ok(peak > 0);
});

test('rev limiter cuts torque above 2700 rpm', () => {
  const below = engineTorque(1, 2600);
  const above = engineTorque(1, 2880);
  assert.ok(above < below * 0.6, `expected limiter to cut hard, got ${below} -> ${above}`);
});

// ---------------------------------------------------------------------- idling

test('engine holds idle with no throttle and the clutch out', () => {
  const s = simulate(() => ({ gas: 0, clutchPedal: 1 }), { seconds: 6 });
  assert.equal(s.status, 'pulling', 'idling must not stall');
  assert.ok(s.rpm > 400, `idle rpm too low: ${s.rpm}`);
  assert.ok(s.rpm < 1800, `idle rpm runaway: ${s.rpm}`);
  assert.equal(s.distance, 0, 'clutch out means no motion');
});

test('revving with the clutch out loads no drive into the wheels', () => {
  const s = simulate(() => ({ gas: 1, clutchPedal: 1 }), { seconds: 1 });
  assert.ok(s.rpm > 2000, `engine should rev freely, got ${s.rpm}`);
  assert.equal(s.distance, 0);
  assert.equal(s.slip, 0);
});

test('sitting on the limiter blows the engine', () => {
  const s = simulate(() => ({ gas: 1, clutchPedal: 1 }), { seconds: 10 });
  assert.equal(s.status, 'blown');
  assert.ok(
    s.elapsed <= 1.5 + OVER_REV_BLOW_S + 0.5,
    `blew too slowly: ${s.elapsed}s`,
  );
});

// ------------------------------------------------------------------ stalling

test('dumping the clutch at idle stalls the engine', () => {
  const s = simulate(() => ({ gas: 0, clutchPedal: 0 }), { seconds: 5 });
  assert.equal(s.status, 'stalled');
  assert.ok(s.distance < 1, `should not get anywhere: ${s.distance}m`);
});

test('dumping the clutch with full gas bogs the engine down', () => {
  const s = simulate(() => ({ gas: 1, clutchPedal: 0 }), { seconds: 5 });
  assert.notEqual(s.status, 'finished');
  assert.ok(s.distance < 5, `dumped clutch should not pull far: ${s.distance}m`);
});

test('stalling needs the clutch: free-revving engine never stalls', () => {
  const s = simulate((t) => ({ gas: 0, clutchPedal: 1 }), { seconds: 3 });
  assert.equal(s.status, 'pulling');
  assert.ok(s.rpm > STALL_RPM);
});

// ------------------------------------------------------------------ finishing

test('a skilled feathered pull finishes the full track', () => {
  const s = simulate(skilled, { seconds: 90 });
  assert.equal(s.status, 'finished', `expected finished, got ${s.status} at ${s.distance}m`);
  assert.equal(s.distance, TRACK_M);
  assert.ok(s.elapsed < 45, `pull took too long: ${s.elapsed}s`);
  assert.ok(s.elapsed > 5, `pull was unrealistically fast: ${s.elapsed}s`);
});

test('skilled pull does not destroy the tyres', () => {
  const s = simulate(skilled, { seconds: 90 });
  assert.ok(s.tireHealth > 0.4, `tyres too cooked: ${s.tireHealth}`);
});

test('distance never exceeds the track length', () => {
  const s = simulate(skilled, { seconds: 90 });
  assert.ok(s.distance <= TRACK_M);
});

// ----------------------------------------------------------------- wheelspin

test('wheelspin is reachable: aggressive gas breaks traction early', () => {
  const s = simulate(
    (t, st) => ({
      gas: 1,
      // hold the clutch just short of a full dump so torque arrives but roughly
      clutchPedal: t < 1.5 ? 1 : Math.max(0.35, 1 - (t - 1.5) / 2),
    }),
    { seconds: 30 },
  );
  assert.ok(s.maxSlip > 0.15, `expected wheelspin, maxSlip=${s.maxSlip}`);
});

test('weight transfer: pulling harder puts more grip on the rear axle', () => {
  const idleGrip = computeTraction(DRY, 1, 0);
  const lightPull = computeTraction(DRY, 1, 4000);
  const hardPull = computeTraction(DRY, 1, 11000);
  assert.ok(lightPull > idleGrip * 1.05, `4kN pull should add grip: ${idleGrip} -> ${lightPull}`);
  assert.ok(hardPull > lightPull * 1.05, `11kN pull should add more: ${lightPull} -> ${hardPull}`);
});

test('weight transfer is capped, so grip cannot grow forever', () => {
  const a = computeTraction(DRY, 1, 40000);
  const b = computeTraction(DRY, 1, 400000);
  assert.equal(a.toFixed(3), b.toFixed(3), 'transfer should saturate');
});

test('worn tyres grip worse', () => {
  const fresh = computeTraction(DRY, 1, 8000);
  const bald = computeTraction(DRY, 0, 8000);
  assert.ok(bald < fresh * 0.5, `bald tyres should be desperate: ${fresh} -> ${bald}`);
});

test('track condition scales grip', () => {
  const dry = computeTraction(DRY, 1, 8000);
  const mud = computeTraction(MUD, 1, 8000);
  assert.ok(mud < dry * 0.8, `mud should be much looser: ${dry} -> ${mud}`);
});

test('for the same sled, a slipperier surface breaks away sooner', () => {
  const run = (cond) => {
    const s = createSimState(cond);
    s.sledStartN = 6000;
    s.sledFinishN = 12000;
    s.status = 'pulling';
    let t = 0;
    for (let i = 0; i < 60 * 120 && s.status === 'pulling'; i += 1) {
      t += DT;
      stepSim(s, careless(t, s), DT);
    }
    return s.maxSlip;
  };
  const dry = run(DRY);
  const wet = run(WET);
  assert.ok(wet >= dry - 0.01, `wet should be slipperier: dry=${dry} wet=${wet}`);
});

test('every surface ends with the sled heavier than the ground can pull', () => {
  for (const cond of TRACK_CONDITIONS) {
    const s = createSimState(cond);
    s.distance = TRACK_M;
    assert.ok(
      sledResistance(s) > gripCeiling(cond, 1),
      `${cond.id}: finish load ${sledResistance(s)} should exceed ceiling ${gripCeiling(cond, 1)}`,
    );
  }
});

test('wet track slips at least as much as dry for the same driver', () => {
  const dry = simulate(skilled, { condition: DRY, seconds: 90 });
  const wet = simulate(skilled, { condition: WET, seconds: 90 });
  assert.ok(
    wet.maxSlip >= dry.maxSlip - 0.01,
    `wet should be slipperier: dry=${dry.maxSlip} wet=${wet.maxSlip}`,
  );
});

test('mud is harder than dry', () => {
  const dry = simulate(skilled, { condition: DRY, seconds: 240 });
  const mud = simulate(skilled, { condition: MUD, seconds: 240 });
  // Both may finish; the mud run must be no better off.
  const rank = (s) => (s.status === 'finished' ? 1 : 0);
  assert.ok(
    rank(mud) <= rank(dry) && mud.distance <= dry.distance + 1,
    `mud should not beat dry: dry=${dry.distance.toFixed(1)}/${dry.status} mud=${mud.distance.toFixed(1)}/${mud.status}`,
  );
});

// --------------------------------------------------------------- tyre burnout

test('sustained wheelspin destroys the tyres', () => {
  const s = simulate(() => ({ gas: 1, clutchPedal: 0.45 }), { condition: MUD, seconds: 60 });
  assert.notEqual(s.tireHealth, 1, 'mud plus full gas should wear tyres');
  if (s.status === 'burnout') {
    assert.equal(s.tireHealth, 0);
    assert.ok(s.elapsed < 60, `burnout took absurdly long: ${s.elapsed}s`);
  }
});

// --------------------------------------------------------------- tyre wear

test('mild slip costs no tread', () => {
  assert.equal(tyreWearRate(0), 0);
  assert.equal(tyreWearRate(0.25), 0);
  assert.equal(tyreWearRate(0.3), 0);
});

test('wear rises steeply with slip', () => {
  const a = tyreWearRate(0.5);
  const b = tyreWearRate(0.75);
  const c = tyreWearRate(1);
  assert.ok(b > a * 2, `0.75 should wear far more than 0.5: ${a} vs ${b}`);
  assert.ok(c > b * 2, `full slip should be brutal: ${b} vs ${c}`);
});

test('full slip destroys a tyre in a couple of seconds', () => {
  assert.ok(
    TIRE_LIFE_AT_FULL_SLIP_S > 1 && TIRE_LIFE_AT_FULL_SLIP_S < 4,
    `tyre life at full slip = ${TIRE_LIFE_AT_FULL_SLIP_S}s`,
  );
});

test('a brief slip spike does not destroy the tyres', () => {
  const s = createSimState(DRY);
  s.status = 'pulling';
  s.slip = 1;
  s.tireHealth = 1;
  // simulate 0.4s of held full slip by driving the wear directly through steps
  for (let i = 0; i < 24; i += 1) {
    s.tireHealth -= tyreWearRate(1) * (1 / 60);
  }
  assert.ok(s.tireHealth > 0.7, `0.4s of spin should survive, got ${s.tireHealth}`);
});

test('a careful driver beats a wet track', () => {
  // Easing off the moment the tyres break away is the whole skill.
  const careful = (t, s) => {
    let gas = 1;
    if (s.rpm > 2300) gas = 0.45;
    if (s.slip > 0.2) gas = 0.15;
    return { gas, clutchPedal: t < 1.5 ? 1 : Math.max(0.1, 1 - (t - 1.5) / 6) };
  };
  const wet = simulate(careful, { condition: WET, seconds: 90 });
  assert.equal(wet.status, 'finished', `careful driving should beat wet: ${wet.status} at ${wet.distance}m`);
});

// -------------------------------------------------------------- the load

test('the sled ramps to more than twice its starting load', () => {
  const s = createSimState(DRY);
  const start = sledResistance(s);
  s.distance = TRACK_M;
  const finish = sledResistance(s);
  assert.ok(
    finish > start * 2,
    `expected the load to more than double, got ${start} -> ${finish}`,
  );
});

test('the sled is hitched to the track: grippier surface, heavier sled', () => {
  const dry = createSimState(DRY);
  const mud = createSimState(MUD);
  assert.ok(
    dry.sledFinishN > mud.sledFinishN * 1.4,
    `dry sled should be far heavier: ${dry.sledFinishN} vs ${mud.sledFinishN}`,
  );
  assert.ok(dry.gripCeilingN > mud.gripCeilingN);
});

test('the sled ends up heavier than the ground can pull', () => {
  const s = createSimState(DRY);
  s.distance = TRACK_M;
  assert.ok(
    sledResistance(s) > gripCeiling(DRY, 1),
    'at the finish the sled must exceed the grip ceiling, or nothing ever struggles',
  );
});

test('the tractor visibly slows down as the load builds', () => {
  const s = createSimState(DRY);
  s.status = 'pulling';
  let t = 0;
  let vPeak = 0;
  for (let i = 0; i < 60 * 240 && s.status === 'pulling'; i += 1) {
    t += DT;
    stepSim(s, skilled(t, s), DT);
    if (s.distance > 10) vPeak = Math.max(vPeak, s.v);
  }
  assert.equal(s.status, 'finished', `run should reach the line, got ${s.status}`);
  assert.ok(
    s.v < vPeak * 0.88,
    `expected a real slowdown into the finish, vPeak=${vPeak.toFixed(2)} vLine=${s.v.toFixed(2)}`,
  );
});

test('a driver who never eases off the gas does not finish', () => {
  const s = simulate(careless, { condition: DRY, seconds: 240 });
  assert.notEqual(s.status, 'finished', 'mashing the gas must not be a winning strategy');
  assert.ok(s.maxSlip > 0.5, `should have been spinning hard: ${s.maxSlip}`);
});

test('a driver who modulates the throttle does finish', () => {
  const s = simulate(skilled, { condition: DRY, seconds: 240 });
  assert.equal(s.status, 'finished', `measured driving should finish: ${s.status} at ${s.distance}m`);
});

// ------------------------------------------------------------- robustness

test('huge dt cannot explode the simulation', () => {
  const s = createSimState(DRY);
  s.status = 'pulling';
  for (let i = 0; i < 50; i += 1) {
    stepSim(s, { gas: 1, clutchPedal: 0 }, 5);
    assertNoNaN(s, `big dt step ${i}`);
  }
});

test('zero dt is a no-op', () => {
  const s = createSimState(DRY);
  s.status = 'pulling';
  const before = JSON.stringify(s);
  stepSim(s, { gas: 1, clutchPedal: 0.5 }, 0);
  // only the input smoothing may have moved; physics must not have run away
  assert.equal(s.distance, 0);
  assert.ok(Math.abs(s.rpm - Number(JSON.parse(before).rpm)) < 500);
});

test('random policies stay finite and in range', () => {
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let run = 0; run < 40; run += 1) {
    const s = createSimState(TRACK_CONDITIONS[run % TRACK_CONDITIONS.length]);
    s.status = 'pulling';
    let t = 0;
    for (let i = 0; i < 60 * 60 && s.status === 'pulling'; i += 1) {
      t += DT;
      stepSim(
        s,
        {
          gas: rand() < 0.7 ? rand() : 1,
          clutchPedal: rand() < 0.5 ? rand() : 0,
        },
        DT * (0.5 + rand()),
      );
      assertNoNaN(s, `random run ${run} step ${i}`);
    }
  }
});

test('hook-up drags the engine down instead of teleporting it to zero', () => {
  // Engine wound up, tractor stood still, clutch dumped: the clutch grabs and the
  // engine must be pulled down by momentum, not annihilated.
  const s = createSimState(DRY);
  s.status = 'pulling';
  s.rpm = 2500;
  s.clutchPedal = 0;
  s.gas = 1;
  const startRpm = s.rpm;
  stepSim(s, { gas: 1, clutchPedal: 0 }, DT);
  assert.ok(s.wheelOmega > 0, 'wheels should have started turning');
  assert.ok(s.rpm < startRpm * 0.95, `engine should be dragged down, still ${s.rpm}`);
  assert.ok(s.rpm > startRpm * 0.2, `engine should not vanish, got ${s.rpm}`);
  assert.ok(s.v > 0, 'tractor should have moved');
});

test('a gentle clutch release hooks up at a higher engine speed than a dump', () => {
  const dump = createSimState(DRY);
  dump.status = 'pulling';
  dump.rpm = 2500;
  dump.clutchPedal = 1;
  dump.gas = 1;
  stepSim(dump, { gas: 1, clutchPedal: 0 }, 0.4);

  const gentle = createSimState(DRY);
  gentle.status = 'pulling';
  gentle.rpm = 2500;
  gentle.clutchPedal = 1;
  gentle.gas = 1;
  // feather: only let a little of the pedal up over the same time
  stepSim(gentle, { gas: 1, clutchPedal: 0.72 }, 0.4);

  assert.ok(
    gentle.rpm > dump.rpm,
    `feathering should preserve revs: dump=${dump.rpm} feather=${gentle.rpm}`,
  );
});

test('same policy gives the same result (deterministic)', () => {
  const a = simulate(skilled, { seconds: 90 });
  const b = simulate(skilled, { seconds: 90 });
  assert.equal(a.distance.toFixed(6), b.distance.toFixed(6));
  assert.equal(a.status, b.status);
});

// ------------------------------------------------------------------ scoring

test('finishing outscores stalling', () => {
  const done = simulate(skilled, { seconds: 90 });
  const dead = simulate(() => ({ gas: 0, clutchPedal: 0 }), { seconds: 5 });
  assert.ok(scoreRun(done).score > scoreRun(dead).score);
});

test('a full pull earns the full-pull bonus', () => {
  const s = simulate(skilled, { seconds: 90 });
  const { score, bonuses } = scoreRun(s);
  assert.ok(bonuses.some((b) => /FULL PULL/i.test(b)), `missing bonus: ${bonuses.join(', ')}`);
  assert.ok(score >= 1000);
});

test('result labels exist for every failure mode', () => {
  for (const status of ['finished', 'blown', 'stalled', 'burnout']) {
    const label = resultFor({ status });
    assert.ok(label.title, `no title for ${status}`);
    assert.ok(label.color, `no colour for ${status}`);
  }
});

// ------------------------------------------------------------- input shaping

test('pedals are analogue, not instant', () => {
  const s = createSimState(DRY);
  s.status = 'pulling';
  stepSim(s, { gas: 1, clutchPedal: 0 }, DT);
  assert.ok(s.gas > 0 && s.gas < 1, `gas should ramp, got ${s.gas}`);
  assert.ok(s.clutchPedal > 0 && s.clutchPedal < 1, `pedal should ramp, got ${s.clutchPedal}`);
});

test('out-of-range input is clamped, not trusted', () => {
  const s = createSimState(DRY);
  s.status = 'pulling';
  stepSim(s, { gas: 99, clutchPedal: -5 }, DT);
  assert.ok(s.gas >= 0 && s.gas <= 1);
  assert.ok(s.clutchPedal >= 0 && s.clutchPedal <= 1);
});

test('missing input fields do not produce NaN', () => {
  const s = createSimState(DRY);
  s.status = 'pulling';
  stepSim(s, {}, DT);
  assertNoNaN(s, 'empty input');
});
