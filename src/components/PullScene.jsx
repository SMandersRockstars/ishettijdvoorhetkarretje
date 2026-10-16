// Side-view scene for the tractor pull. Inline SVG, same approach as Fan.jsx —
// no image assets, everything rotates/tilts off live sim values.

const PX_PER_M = 12;
const GROUND_Y = 352;
const REAR_WHEEL = { cx: 600, cy: 300, r: 52 };
const FRONT_WHEEL = { cx: 742, cy: 326, r: 26 };

// The track is a dirt course in every condition — only the moisture changes.
const TRACK_SURFACE = {
  dry: '#7a4f24',
  damp: '#5e3c1c',
  wet: '#402a17',
  mud: '#2e1e10',
};

function Wheel({ cx, cy, r, angle, hub = '#3a3a3a' }) {
  const spokes = [0, 45, 90, 135];
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" stroke="#000" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r * 0.72} fill="#2c2c2c" stroke="#111" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r * 0.5} fill={hub} />
      {spokes.map((deg) => (
        <rect
          key={deg}
          x={cx - r * 0.07}
          y={cy - r * 0.5}
          width={r * 0.14}
          height={r}
          fill="#5a5a5a"
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.13} fill="#9a9a9a" />
      {/* tread lugs so the spin is readable */}
      {[0, 30, 60, 90, 120, 150].map((deg) => (
        <rect
          key={`t${deg}`}
          x={cx - r * 0.05}
          y={cy - r}
          width={r * 0.1}
          height={r * 0.16}
          fill="#0d0d0d"
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
    </g>
  );
}

// Five-point star, used on the lager crates.
function starPath(cx, cy, ro, ri) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? ro : ri;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

// Beer crate palettes. Each one is a plastic crate: body, rim, vents, foot rail,
// dark brand banner with a serif wordmark, plus a star or an emblem.
const CRATE_STYLES = {
  heineken: {
    body: '#0e9c46', dark: '#0a6a30', rim: '#14b957', banner: '#075026',
    accent: '#e8232a', text: '#ffffff', star: true, brand: 'Heineken', mark: '24×33cl',
  },
  jupiler: {
    body: '#1668b1', dark: '#0d4a80', rim: '#2181cc', banner: '#0a3a66',
    accent: '#e8232a', text: '#ffffff', star: false, brand: 'Jupiler', mark: '24×25cl',
  },
  hertog: {
    body: '#8d1f2c', dark: '#5c121c', rim: '#a52938', banner: '#480e16',
    accent: '#e8b93a', text: '#f7e7c4', star: false, brand: 'Hertog Jan', mark: '24×30cl',
  },
  cola: {
    body: '#c0392b', dark: '#8e2418', rim: '#d9503c', banner: '#7a1c12',
    accent: '#ffffff', text: '#ffffff', star: false, brand: 'Cola', mark: '24×33cl',
  },
  frites: {
    body: '#e0a80f', dark: '#a97c06', rim: '#f4c22e', banner: '#8a6404',
    accent: '#ffffff', text: '#fff8e0', star: false, brand: 'Friet', mark: 'ZAK 3KG',
  },
  wijn: {
    body: '#6d214f', dark: '#471334', rim: '#832a5f', banner: '#38102a',
    accent: '#e8b93a', text: '#f2dce9', star: false, brand: 'Wijn', mark: '6×75cl',
  },
};

function Crate({ x, y, w, h, style }) {
  const s = CRATE_STYLES[style] || CRATE_STYLES.heineken;
  const vents = [0.1, 0.26, 0.74, 0.9];
  const brandSize = s.brand.length > 8 ? 6.6 : 8;
  const bannerY = y + h * 0.5;
  const bannerH = h * 0.36;

  return (
    <g>
      {/* body */}
      <rect x={x} y={y} width={w} height={h} rx="2.5" fill={s.body} stroke={s.dark} strokeWidth="1.5" />
      {/* top rim */}
      <rect x={x} y={y} width={w} height="5" rx="2" fill={s.rim} />
      {/* foot rail */}
      <rect x={x + 2} y={y + h - 4} width={w - 4} height="4" rx="1.5" fill={s.dark} opacity="0.9" />
      {/* vertical ventilation slots */}
      {vents.map((f) => (
        <rect
          key={f}
          x={x + w * f - 2}
          y={y + 7}
          width="4"
          height={h - 14}
          rx="2"
          fill={s.dark}
          opacity="0.5"
        />
      ))}
      {/* brand banner */}
      <rect
        x={x + 5}
        y={bannerY}
        width={w - 10}
        height={bannerH}
        rx="2"
        fill={s.banner}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.8"
      />
      <text
        x={x + w / 2}
        y={bannerY + bannerH * 0.74}
        textAnchor="middle"
        fontSize={brandSize}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        letterSpacing="0.2"
        fill={s.text}
      >
        {s.brand}
      </text>
      {/* emblem */}
      {s.star ? (
        <path d={starPath(x + w * 0.3, y + h * 0.3, 5.6, 2.4)} fill={s.accent} />
      ) : (
        <g>
          <circle cx={x + w * 0.3} cy={y + h * 0.3} r="5" fill={s.banner} stroke={s.accent} strokeWidth="1" />
          <circle cx={x + w * 0.3} cy={y + h * 0.3} r="2.2" fill={s.accent} />
        </g>
      )}
      {/* contents mark */}
      <text
        x={x + w * 0.73}
        y={y + h * 0.35}
        textAnchor="middle"
        fontSize="5"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill={s.text}
        opacity="0.85"
      >
        {s.mark}
      </text>
      {/* plastic sheen */}
      <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h * 0.22} rx="2" fill="rgba(255,255,255,0.13)" />
    </g>
  );
}

// Bottle necks poking over the rim of the topmost crate.
function BottleNecks({ x, y, count = 5, spacing = 11 }) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const nx = x + i * spacing;
        return (
          <g key={i}>
            <rect x={nx} y={y - 15} width="6" height="15" rx="1.5" fill="#2f7a34" />
            <rect x={nx + 0.6} y={y - 19} width="4.8" height="4" rx="1" fill="#c9a227" />
            <rect x={nx + 0.4} y={y - 10} width="5.2" height="4" fill="#f0ead0" opacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

export function PullScene({
  wheelAngle = 0,
  noseAngle = 0,
  distance = 0,
  slip = 0,
  lugging = false,
  load01 = 0,
  condition = { id: 'dry' },
  reducedMotion = false,
}) {
  const wheelDeg = (wheelAngle * 180) / Math.PI % 360;
  const pivotX = REAR_WHEEL.cx;
  const pivotY = GROUND_Y;

  // Camera keeps the tractor roughly centre-right; the world slides past it.
  // A marker for metre m sits to the RIGHT when it is still ahead of us.
  const marks = [];
  for (let m = 0; m <= 100; m += 5) {
    const x = pivotX + (m - distance) * PX_PER_M;
    if (x < -60 || x > 1060) continue;
    const major = m % 10 === 0;
    marks.push(
      <g key={m}>
        <rect
          x={x}
          y={GROUND_Y}
          width={major ? 3 : 2}
          height={major ? 14 : 8}
          fill={major ? '#f2d06b' : 'rgba(242,208,107,0.45)'}
        />
        {major ? (
          <text
            x={x + 1}
            y={GROUND_Y + 28}
            textAnchor="middle"
            fontSize="11"
            fontFamily="monospace"
            fill="#f2d06b"
            opacity="0.8"
          >
            {m}m
          </text>
        ) : null}
      </g>,
    );
  }

  const dirtCount = reducedMotion ? 0 : Math.round(Math.min(1, slip / 0.5) * 12);
  const exhaustCount = reducedMotion ? 0 : lugging ? 6 : 2;
  // The heavier the sled, the deeper the load digs in.
  const sink = load01 * 8;
  const rutDepth = 2 + load01 * 7;

  return (
    <svg viewBox="0 0 1000 420" className="pull-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="pullSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b1030" />
          <stop offset="55%" stopColor="#3a1c14" />
          <stop offset="100%" stopColor="#6b3410" />
        </linearGradient>
        <linearGradient id="pullDirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2c15" />
          <stop offset="100%" stopColor="#241408" />
        </linearGradient>
        <pattern id="pullChecker" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#fff" />
          <rect width="8" height="8" fill="#111" />
          <rect x="8" y="8" width="8" height="8" fill="#111" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="1000" height={GROUND_Y} fill="url(#pullSky)" />
      <rect x="0" y={GROUND_Y} width="1000" height={420 - GROUND_Y} fill="url(#pullDirt)" />

      {/* track surface strip — always dirt, just wetter or drier */}
      <rect x="0" y={GROUND_Y} width="1000" height="6" fill={TRACK_SURFACE[condition.id] || TRACK_SURFACE.dry} opacity="0.9" />

      {marks}

      {/* start line */}
      {(() => {
        const x = pivotX + (0 - distance) * PX_PER_M;
        if (x < -40 || x > 1060) return null;
        return (
          <g>
            <rect x={x - 3} y={GROUND_Y - 190} width={6} height={190} fill="url(#pullChecker)" />
            <rect x={x - 34} y={GROUND_Y - 208} width={68} height={18} fill="#111" stroke="#f2d06b" strokeWidth="2" />
            <text x={x} y={GROUND_Y - 194} textAnchor="middle" fontSize="13" fontFamily="Impact, sans-serif" fill="#f2d06b">
              START
            </text>
          </g>
        );
      })()}

      {/* finish line */}
      {(() => {
        const x = pivotX + (100 - distance) * PX_PER_M;
        if (x < -40 || x > 1060) return null;
        return (
          <g>
            <rect x={x} y={GROUND_Y - 190} width={14} height={190} fill="url(#pullChecker)" />
            <rect x={x - 4} y={GROUND_Y - 208} width={90} height={20} fill="#111" stroke="#f2d06b" strokeWidth="2" />
            <text x={x + 41} y={GROUND_Y - 193} textAnchor="middle" fontSize="14" fontFamily="Impact, sans-serif" fill="#f2d06b">
              FINISH
            </text>
          </g>
        );
      })()}

      {/* rut torn up behind the tractor, deeper as the load builds */}
      <path
        d={`M0 ${GROUND_Y - 2} L${pivotX} ${GROUND_Y - 2} L${pivotX} ${GROUND_Y + rutDepth} L0 ${GROUND_Y + rutDepth} Z`}
        fill="#5a3a1c"
        opacity="0.85"
      />
      <path
        d={`M0 ${GROUND_Y - 2} L${pivotX} ${GROUND_Y - 2} L${pivotX} ${GROUND_Y} L0 ${GROUND_Y} Z`}
        fill="#8a5a2b"
        opacity="0.5"
      />

      {/* ---- the load: the company karretje, loaded with crates ---- */}
      <g transform={`translate(0 ${sink}) rotate(${Math.min(6, noseAngle * 0.22)} 450 ${GROUND_Y})`}>
        {/* tow bar */}
        <line x1="470" y1="292" x2="556" y2="304" stroke="#8a8a8a" strokeWidth="6" strokeLinecap="round" />
        {/* cart frame */}
        <rect x="300" y="248" width="172" height="76" fill="rgba(190,190,200,0.28)" stroke="#c8c8d2" strokeWidth="3" rx="3" />
        {[316, 332, 348, 364, 380, 396, 412, 428, 444, 460].map((gx) => (
          <line key={gx} x1={gx} y1="250" x2={gx} y2="322" stroke="rgba(220,220,230,0.35)" strokeWidth="1.5" />
        ))}
        {[264, 280, 296, 312].map((gy) => (
          <line key={gy} x1="301" y1={gy} x2="471" y2={gy} stroke="rgba(220,220,230,0.35)" strokeWidth="1.5" />
        ))}
        {/* handle */}
        <path d="M300 248 L282 232 L272 232" stroke="#c8c8d2" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* crates: bottom row of three, two on top of those, one on top */}
        <Crate x={303} y={288} w={55} h={34} style="heineken" />
        <Crate x={359} y={288} w={55} h={34} style="cola" />
        <Crate x={415} y={288} w={55} h={34} style="hertog" />
        <Crate x={331} y={252} w={55} h={34} style="jupiler" />
        <Crate x={387} y={252} w={55} h={34} style="wijn" />
        <BottleNecks x={363} y={216} count={5} spacing={10.5} />
        <Crate x={359} y={216} w={55} h={34} style="frites" />
        {/* cart wheels */}
        <Wheel cx={330} cy={336} r={16} angle={wheelDeg} hub="#4a4a4a" />
        <Wheel cx={452} cy={336} r={16} angle={wheelDeg} hub="#4a4a4a" />
        {/* dirt pushed up by the trailing wheels as the load bites */}
        {!reducedMotion && load01 > 0.15 ? (
          <path
            d={`M${306 - load01 * 26} ${GROUND_Y + sink} q ${10 + load01 * 8} ${-14 * load01} ${22 + load01 * 14} ${-3 * load01} Z`}
            fill="#6b421d"
            opacity={0.5 + load01 * 0.4}
          />
        ) : null}
      </g>

      {/* ---- the tractor: whole body tips back on the reaction ---- */}
      <g transform={`rotate(${-noseAngle} ${pivotX} ${pivotY})`}>
        {/* chassis */}
        <rect x="560" y="272" width="200" height="26" fill="#7d1d12" stroke="#3d0d06" strokeWidth="2" />
        {/* hood */}
        <rect x="654" y="222" width="112" height="62" fill="#a3241a" stroke="#3d0d06" strokeWidth="2" rx="4" />
        <rect x="756" y="228" width="12" height="50" fill="#2b2b2b" stroke="#111" strokeWidth="1.5" />
        {[236, 246, 256, 266].map((gy) => (
          <line key={gy} x1="758" y1={gy} x2="766" y2={gy} stroke="#6a6a6a" strokeWidth="2" />
        ))}
        {/* cab */}
        <rect x="566" y="176" width="86" height="98" fill="#a3241a" stroke="#3d0d06" strokeWidth="2" rx="4" />
        <rect x="578" y="188" width="62" height="46" fill="#7fd4ff" opacity="0.55" stroke="#2a4a5a" strokeWidth="2" />
        <rect x="562" y="168" width="94" height="12" fill="#5c140c" rx="2" />
        {/* exhaust stack */}
        <rect x="668" y="150" width="11" height="76" fill="#4a4a4a" stroke="#1a1a1a" strokeWidth="1.5" />
        <rect x="665" y="144" width="17" height="8" fill="#2a2a2a" rx="2" />
        {/* exhaust smoke — lives INSIDE the body group so it follows the pipe when
            the tractor tilts. Lazy grey at idle, thick black when lugging. */}
        {!reducedMotion &&
          Array.from({ length: exhaustCount }).map((_, i) => (
            <circle
              key={`ex${i}`}
              className={`pull-exhaust ${lugging ? 'is-lug' : ''}`}
              cx={673.5 + (i % 3) * 2.5 - 2.5}
              cy={142 - (i % 2) * 2}
              r={4 + (i % 4) * 2}
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        {/* rear fender */}
        <path
          d={`M${REAR_WHEEL.cx - 59} 292 A 59 59 0 0 1 ${REAR_WHEEL.cx + 59} 292`}
          fill="none"
          stroke="#7d1d12"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* hitch */}
        <rect x="546" y="296" width="22" height="12" fill="#555" stroke="#222" strokeWidth="1.5" />
        {/* headlight */}
        <circle cx="752" cy="238" r="7" fill="#fff6c8" opacity="0.9" />
        {/* driver */}
        <circle cx="606" cy="206" r="11" fill="#e8b48c" />
        <rect x="596" y="215" width="22" height="26" fill="#1f3f6b" rx="3" />
        <rect x="600" y="196" width="14" height="6" fill="#111" rx="2" />
      </g>

      {/* wheels drawn after the body so they sit on top */}
      <g transform={`rotate(${-noseAngle} ${pivotX} ${pivotY})`}>
        <Wheel cx={REAR_WHEEL.cx} cy={REAR_WHEEL.cy} r={REAR_WHEEL.r} angle={wheelDeg} />
        <Wheel cx={FRONT_WHEEL.cx} cy={FRONT_WHEEL.cy} r={FRONT_WHEEL.r} angle={wheelDeg} hub="#4a4a4a" />
      </g>

      {/* dirt thrown off the rear tyre contact patch */}
      {!reducedMotion &&
        Array.from({ length: dirtCount }).map((_, i) => {
          const back = 4 + (i % 6) * 11;
          const dy = GROUND_Y - 2 - (i % 3) * 2;
          const delay = { animationDelay: `${(i * 0.06).toFixed(2)}s` };
          // every third particle is a solid clod, the rest is dust
          if (i % 3 === 0) {
            return (
              <rect
                key={`clod${i}`}
                className="pull-clod"
                x={REAR_WHEEL.cx - back}
                y={dy - 3}
                width={4 + (i % 4)}
                height={3 + (i % 3)}
                rx="1"
                style={delay}
              />
            );
          }
          return (
            <circle
              key={`dust${i}`}
              className="pull-dust"
              cx={REAR_WHEEL.cx - back}
              cy={dy}
              r={5 + (i % 5) * 2.5}
              style={delay}
            />
          );
        })}
    </svg>
  );
}
