// Tractor-pulling simulation. Pure JS, no React, no DOM.
//
// The whole game is the tension between three limits:
//   gas      -> engine RPM -> torque
//   clutch   -> how much torque reaches the wheels (pedal DOWN = disengaged)
//   grip     -> a ceiling. Torque above it = wheelspin (smoke, no distance, tyres
//              burn). Torque below the load = the engine lugs down and stalls.
//
// As the load is dragged, weight transfers to the rear axle: grip rises over the
// track while the cart's resistance also climbs. Early on you can spin the tyres;
// late on you can run out of torque. The middle is where the pull is won.
//
// The drivetrain has four states, resolved every substep:
//   clutch locked   + tyre gripped  -> engine..chassis move as one body
//   clutch locked   + tyre spinning -> engine drives wheels only, road gets mu*N
//   clutch slipping + tyre gripped  -> engine on its own inertia, load barely moves
//   clutch slipping + tyre spinning -> everything decoupled, smoke everywhere

export const TRACK_M = 100;

const G = 9.81;
export const TRACTOR_KG = 2800;
export const CART_KG = 520; // loaded with crates
export const WHEEL_R = 0.55; // rear tyre radius, m
export const GEAR = 14; // total drive ratio, single gear
const ENGINE_I = 4; // kg*m^2, engine + flywheel (heavy diesel + flywheel)
const WHEEL_I = 420; // kg*m^2, wheels + drivetrain
export const VEHICLE_KG = TRACTOR_KG + CART_KG;

export const IDLE_RPM = 800;
export const REDLINE_RPM = 2900;
export const STALL_RPM = 420;
export const OVER_REV_BLOW_S = 1.2;

const CLUTCH_MAX_TQ = 900; // Nm the clutch pack can transmit
const CLUTCH_DAMP = 120; // Nm per rad/s of slip
const BASE_REAR_SHARE = 0.55; // fraction of weight on the rear axle at rest
const BASE_MU = 0.62; // grippy-but-not-magical packed dirt
const WHEELBASE = 2.4; // m
const TOW_HEIGHT = 0.9; // m, hitch height behind the rear axle
const LOCK_EPS = 0.5; // rad/s of engine/wheel mismatch treated as "already coupled"

// The sled is hitched to what the track can actually give: it starts at roughly
// half the grip ceiling and digs down to well past it. A fixed sled weight is
// invisible — either the tractor never feels it, or nothing could ever move it.
const SLED_START_FRAC = 0.45;
const SLED_FINISH_FRAC = 0.8;
const SLED_CURVE = 2.0;
// A real sled ploughs: drag it faster and it digs harder. Without this the tractor
// banks speed early on the light end of the track and then coasts through the heavy
// end, so the increasing weight is never felt. With it, speed decays all the way
// down and the engine can actually be dragged under idle and die.
export const SLED_PLOW_K = 0.006;

// Fixed internal timestep. The clutch damper is stiff; at 1/120 s the explicit
// integrator stays well inside its stability region even at 30 fps presentation.
const SIM_DT = 1 / 120;
const MAX_SUBSTEPS = 40;

const RPM2RAD = (2 * Math.PI) / 60;
const RAD2RPM = 60 / (2 * Math.PI);

export const TRACK_CONDITIONS = [
  { id: 'dry', label: 'PACKED DIRT', mu: 1.0 },
  { id: 'damp', label: 'DAMP TRACK', mu: 0.9 },
  { id: 'wet', label: 'WET / SLIMY', mu: 0.78 },
  { id: 'mud', label: 'MUD PIT', mu: 0.66 },
];

// Torque curve of a big farm diesel: fat low end, peak near 1500 rpm, falls away
// hard towards the limiter.
const TORQUE_POINTS = [
  [0, 520],
  [800, 600],
  [1500, 900],
  [2200, 760],
  [2900, 430],
];

export function torqueCurve(rpm) {
  const pts = TORQUE_POINTS;
  if (rpm <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i += 1) {
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    if (rpm <= x2) return y1 + (y2 - y1) * ((rpm - x1) / (x2 - x1));
  }
  return pts[pts.length - 1][1];
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Rev limiter: fuel is cut progressively above 2700 rpm so the engine hovers at
// the limiter instead of instantly exploding. Sit there and you still die.
function limiter(rpm) {
  if (rpm <= 2700) return 1;
  return Math.max(0.06, 1 - (rpm - 2700) / 260);
}

// Idle governor: with the throttle shut the engine holds idle rather than dying.
function idleFloor(rpm) {
  const gov = (IDLE_RPM - rpm) * 1.5 + 250;
  return clamp(gov, 0, torqueCurve(rpm) * 0.3);
}

// Full-throttle ground force is scaled against the dry grip ceiling. If the engine
// is far stronger than the ground, every meaningful throttle breaks traction and
// a burnout cannot be recovered -- the driver has no usable band. ~1.25x keeps
// the throttle a traction control you modulate rather than a coin flip.
export const TORQUE_SCALE = 1;

export function engineTorque(gas, rpm) {
  const peak = torqueCurve(rpm) * TORQUE_SCALE;
  if (gas < 0.08) return idleFloor(rpm);
  return peak * gas * limiter(rpm);
}

// Tyre wear per second, as a fraction of the whole tread. Mild slip polishes the
// rubber; sustained wheelspin eats through it in about two seconds. The floor
// matters: without it a clean 14 second pull would also destroy the tyres.
const WEAR_SLIP_FLOOR = 0.3;
const WEAR_SCALE_S = 1.2;

export function tyreWearRate(slip) {
  const s = Math.max(0, clamp(slip, 0, 1) - WEAR_SLIP_FLOOR);
  return Math.pow(s, 1.6) / WEAR_SCALE_S;
}

export const TIRE_LIFE_AT_FULL_SLIP_S = 1 / tyreWearRate(1);

// Maximum horizontal force the ground will take, in newtons, for a given drawbar
// pull. Pulling harder transfers weight to the rear axle, which buys more grip —
// that feedback loop is the heart of the sport. Worn tyres get less of it.
export function computeTraction(condition, tireHealth, drawbarN) {
  const weight = VEHICLE_KG * G;
  const transfer = clamp((drawbarN * TOW_HEIGHT) / (WHEELBASE * weight), 0, 0.3);
  const rearNormal = weight * (BASE_REAR_SHARE + transfer);
  const mu = BASE_MU * condition.mu * (0.3 + 0.7 * clamp(tireHealth, 0, 1));
  return mu * rearNormal;
}

export function createSimState(condition = TRACK_CONDITIONS[0]) {
  const ceiling = gripCeiling(condition, 1);
  return {
    status: 'ready', // ready | pulling | finished | stalled | blown | burnout
    rpm: IDLE_RPM,
    wheelOmega: 0, // rad/s
    wheelAngle: 0, // rad, spins the SVG spokes
    v: 0, // ground speed m/s
    distance: 0,
    gas: 0,
    clutchPedal: 1, // 1 = pedal floored = clutch fully disengaged
    elapsed: 0,
    overRev: 0,
    tireHealth: 1,
    slip: 0,
    maxSlip: 0,
    noseAngle: 0,
    maxNose: 0,
    driveForce: 0, // N actually delivered at the drawbar
    tractionForce: 0, // N the ground will sustain right now
    gripCeilingN: ceiling,
    sledStartN: ceiling * SLED_START_FRAC,
    sledFinishN: ceiling * SLED_FINISH_FRAC,
    clutchLocked: false,
    wheelspin: false,
    condition,
  };
}

// Maximum drawbar force the ground will sustain, newtons. Weight transfer feeds the
// pull back into rear-axle load, so this is the fixed point of
//   pull = mu * W * (share + pull * h / (L * W))
export function gripCeiling(condition, tireHealth = 1) {
  const weight = VEHICLE_KG * G;
  const mu = BASE_MU * condition.mu * (0.3 + 0.7 * clamp(tireHealth, 0, 1));
  const kTransfer = (mu * TOW_HEIGHT) / WHEELBASE;
  return (mu * weight * BASE_REAR_SHARE) / Math.max(0.25, 1 - kTransfer);
}

// The sled's own resistance at the current point of the run, newtons. Convex:
// gentle off the line, brutal in the last twenty metres.
export function sledResistance(state) {
  const t = clamp(state.distance / TRACK_M, 0, 1);
  return state.sledStartN + (state.sledFinishN - state.sledStartN) * Math.pow(t, SLED_CURVE);
}

function resistForce(state) {
  const plough = 1 + SLED_PLOW_K * state.v * state.v;
  return sledResistance(state) * plough + 0.9 * state.v * state.v;
}

function substep(state, input, dt) {
  // --- pedals have travel; input is smoothed, never instant ---
  const gasTarget = clamp(input.gas ?? 0, 0, 1);
  const pedalTarget = clamp(input.clutchPedal ?? 1, 0, 1);
  const gasRate = gasTarget > state.gas ? 7 : 5;
  state.gas += (gasTarget - state.gas) * clamp(dt * gasRate, 0, 1);
  state.clutchPedal += (pedalTarget - state.clutchPedal) * clamp(dt * 6, 0, 1);

  if (state.status !== 'pulling') {
    state.v *= 1 - clamp(dt * 1.5, 0, 1);
    state.wheelOmega = Math.max(0, state.v / WHEEL_R);
    state.wheelAngle += state.wheelOmega * dt;
    state.rpm += (0 - state.rpm) * clamp(dt * 1.2, 0, 1);
    state.slip = 0;
    state.noseAngle += (0 - state.noseAngle) * clamp(dt * 3, 0, 1);
    return;
  }

  state.elapsed += dt;

  const engaged = 1 - state.clutchPedal;
  const cap = engaged * CLUTCH_MAX_TQ;
  const gasTorque = engineTorque(state.gas, state.rpm);
  const engineBrake = 12 + state.rpm * 0.02;
  const resist = resistForce(state);

  // Grip ceiling for the current surface and tyre wear.
  const maxPull = gripCeiling(state.condition, state.tireHealth);
  state.tractionForce = maxPull;

  const slipAng = state.rpm * RPM2RAD - state.wheelOmega * GEAR;
  // Kinematic wheelspin: the tyres are physically faster than the ground,
  // regardless of what the torque balance currently says. `spinning` must honour
  // this too. Deciding it on torque alone lets a state that stops being
  // torque-limited fall into the gripped path, where v is assigned from an
  // inflated wheel speed -- teleporting the vehicle forward and pumping free
  // momentum into it every time the clutch oscillates.
  const kinSpin = state.wheelOmega * WHEEL_R > state.v + 0.05;
  const iEngineRef = ENGINE_I * GEAR * GEAR;
  const iVehicleRef = VEHICLE_KG * WHEEL_R * WHEEL_R;
  const iFull = iEngineRef + WHEEL_I + iVehicleRef;

  // What the drivetrain would do if clutch and tyres were both locked.
  const aFull = ((gasTorque - engineBrake) * GEAR - resist * WHEEL_R) / iFull;
  const tcNeeded = gasTorque - engineBrake - ENGINE_I * aFull * GEAR;

  let clutchTorque;
  let spinning;

  // The clutch holds whenever the pack can carry the torque. Locking is tracked
  // with the previous state's flag rather than inferred from the current speed
  // difference: inferring it made the hook-up collision re-fire on every substep
  // while the tyres were spinning, pumping free momentum into the vehicle (felt
  // as the tractor accelerating when the clutch pedal went down). The hook-up is
  // now a one-shot event on a real unlocked -> locked transition.
  const holds = Math.abs(tcNeeded) <= cap;

  if (holds) {
    const wasLocked = state.clutchLocked;
    state.clutchLocked = true;
    clutchTorque = tcNeeded;
    const demanded = (Math.max(0, clutchTorque) * GEAR) / WHEEL_R;
    const pull = Math.min(demanded, maxPull);
    spinning = demanded > pull + 1 || kinSpin;

    if (!wasLocked && Math.abs(slipAng) >= LOCK_EPS) {
      // Hook-up is a one-shot inelastic collision: angular momentum is conserved,
      // energy is not. Skipping this makes the engine vanish instead of being
      // dragged down.
      const coupledWheelI = spinning ? WHEEL_I : WHEEL_I + iVehicleRef;
      const iBody = spinning ? iEngineRef + WHEEL_I : iFull;
      const L = ENGINE_I * state.rpm * RPM2RAD * GEAR + coupledWheelI * state.wheelOmega;
      state.wheelOmega = Math.max(0, L / iBody);
      state.rpm = Math.max(0, state.wheelOmega * GEAR * RAD2RPM);
    }

    if (!spinning) {
      state.wheelOmega = Math.max(0, state.wheelOmega + aFull * dt);
      state.rpm = Math.max(0, state.wheelOmega * GEAR * RAD2RPM);
      state.v = state.wheelOmega * WHEEL_R;
      state.slip = 0;
    } else {
      // Tyres broke away: the ground only ever receives `pull`, the excess just
      // spins the wheels and cooks the rubber.
      const iSpin = iEngineRef + WHEEL_I;
      const net = (gasTorque - engineBrake) * GEAR - pull * WHEEL_R;
      state.wheelOmega = Math.max(0, state.wheelOmega + (net / iSpin) * dt);
      state.rpm = Math.max(0, state.wheelOmega * GEAR * RAD2RPM);
      state.v = Math.max(0, state.v + ((pull - resist) / VEHICLE_KG) * dt);
      const surface = Math.max(state.wheelOmega * WHEEL_R, 0.35);
      state.slip = clamp((state.wheelOmega * WHEEL_R - state.v) / surface, 0, 1);
    }
    state.driveForce = pull;
  } else {
    // Slipping: engaged but the sides differ, or the demand exceeds the pack. The
    // clutch sheds its capacity against the slip and keeps slipping until the
    // speeds converge, so there is never an impulse to reconcile afterwards.
    state.clutchLocked = false;
    clutchTorque = clamp(slipAng * CLUTCH_DAMP, -cap, cap);
    const demanded = (Math.max(0, clutchTorque) * GEAR) / WHEEL_R;
    const pull = Math.min(demanded, maxPull);
    spinning = demanded > pull + 1 || kinSpin;

    const iWheel = spinning ? WHEEL_I : WHEEL_I + iVehicleRef;
    const wheelLoad = spinning ? pull * WHEEL_R : resist * WHEEL_R;
    state.wheelOmega = Math.max(
      0,
      state.wheelOmega + ((demanded * WHEEL_R - wheelLoad) / iWheel) * dt,
    );

    if (spinning) {
      state.v = Math.max(0, state.v + ((pull - resist) / VEHICLE_KG) * dt);
    } else {
      state.v = state.wheelOmega * WHEEL_R;
    }

    const dwe = ((gasTorque - engineBrake - clutchTorque) / ENGINE_I) * dt;
    state.rpm = Math.max(0, state.rpm + dwe * RAD2RPM);

    if (spinning) {
      const surface = Math.max(state.wheelOmega * WHEEL_R, 0.35);
      state.slip = clamp((state.wheelOmega * WHEEL_R - state.v) / surface, 0, 1);
    } else {
      state.slip = 0;
    }
    state.driveForce = pull;
  }

  state.wheelspin = spinning;
  state.wheelAngle += state.wheelOmega * dt;
  state.distance += state.v * dt;
  state.maxSlip = Math.max(state.maxSlip, state.slip);

  // --- nose lift: torque reaction tips the front end up ---
  const noseDrive = clamp((state.driveForce / Math.max(maxPull, 1) - 0.72) * 1.35, 0, 1);
  const speedDamp = clamp(1 - state.v / 9, 0, 1);
  const noseTarget = noseDrive * speedDamp * 26;
  state.noseAngle += (noseTarget - state.noseAngle) * clamp(dt * 4.5, 0, 1);
  state.maxNose = Math.max(state.maxNose, state.noseAngle);

  // --- tyres cook themselves when slipping ---
  if (state.slip > WEAR_SLIP_FLOOR) {
    state.tireHealth -= tyreWearRate(state.slip) * dt;
    if (state.tireHealth <= 0) {
      state.tireHealth = 0;
      state.status = 'burnout';
    }
  }

  // --- over-rev ---
  if (state.rpm > REDLINE_RPM) {
    state.overRev += dt;
    state.rpm = Math.min(state.rpm, REDLINE_RPM + 200);
    if (state.overRev > OVER_REV_BLOW_S) state.status = 'blown';
  } else {
    state.overRev = Math.max(0, state.overRev - dt * 0.5);
  }

  // --- stall: dragged below idle while coupled to the load ---
  if (state.rpm < STALL_RPM && engaged > 0.15) state.status = 'stalled';
  else if (state.rpm < 200) state.status = 'stalled';

  if (state.distance >= TRACK_M) {
    state.distance = TRACK_M;
    state.status = 'finished';
  }
}

// Advance the sim by dtRaw seconds using fixed internal substeps, so behaviour is
// independent of the presentation frame rate.
export function stepSim(state, input, dtRaw) {
  const total = clamp(Number.isFinite(dtRaw) ? dtRaw : 0, 0, MAX_SUBSTEPS * SIM_DT);
  let remaining = total;
  while (remaining > 1e-9) {
    const h = Math.min(SIM_DT, remaining);
    substep(state, input, h);
    remaining -= h;
  }
  return state;
}

export function scoreRun(state) {
  let score = Math.round(state.distance * 10);
  const bonuses = [];

  if (state.status === 'finished') {
    score += 1000;
    bonuses.push('FULL PULL +1000');
  }
  if (state.status === 'finished' && state.maxSlip < 0.35) {
    score += 500;
    bonuses.push('CLEAN HOOK-UP +500');
  }
  if (state.maxNose > 15) {
    score += 250;
    bonuses.push('FRONT END UP +250');
  }
  if (state.status === 'finished') {
    const tb = Math.round(Math.max(0, 40 - state.elapsed) * 10);
    if (tb > 0) {
      score += tb;
      bonuses.push(`SPEED BONUS +${tb}`);
    }
  }

  return { score, bonuses };
}

export const RESULT_LABELS = {
  finished: { title: 'FULL PULL!!!', color: '#FFD700' },
  blown: { title: 'ENGINE BLOWN', color: '#FF3322' },
  stalled: { title: 'STALLED', color: '#FF8844' },
  burnout: { title: 'TYRES GONE', color: '#BB66FF' },
};

export function resultFor(state) {
  return RESULT_LABELS[state.status] || { title: 'RUN OVER', color: '#FFFFFF' };
}
