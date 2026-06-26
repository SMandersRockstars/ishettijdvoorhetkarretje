import { useState, useRef, useEffect } from 'react';
import { useWeather } from '../hooks/useWeather';

const SPEEDS = [
  { label: 'SLOW', duration: '2s' },
  { label: 'MED', duration: '0.7s' },
  { label: 'FAST', duration: '0.2s' },
];

const win95Border = {
  borderTop: '2px solid #ffffff',
  borderLeft: '2px solid #ffffff',
  borderRight: '2px solid #808080',
  borderBottom: '2px solid #808080',
};

const win95BorderInset = {
  borderTop: '2px solid #808080',
  borderLeft: '2px solid #808080',
  borderRight: '2px solid #ffffff',
  borderBottom: '2px solid #ffffff',
};

function isMobile() {
  return window.innerWidth < 600;
}

const BLADE_COLORS = ['#ff00ff', '#00ffff', '#ffff00', '#ff88ff'];
const BLADE_COLORS_HOT  = ['#ff4400', '#ff8800', '#ffcc00', '#ff6600'];

function FanSvg({ spinDuration, overdrivePhase }) {
  const isLaunching = overdrivePhase === 'launching';
  const isCharging  = overdrivePhase === 'charging';
  const size = isMobile() ? Math.round(window.innerWidth * 0.38) : 200;
  const colors = isCharging || isLaunching ? BLADE_COLORS_HOT : BLADE_COLORS;

  return (
    <div style={{
      animation: isLaunching
        ? 'fan-launch 0.9s cubic-bezier(0.4, 0, 1, 1) forwards'
        : isCharging
          ? 'fan-shake 0.12s linear infinite'
          : 'none',
      display: 'inline-block',
    }}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          animation: `fan-spin ${spinDuration} linear infinite`,
          display: 'block',
          filter: isCharging || isLaunching
            ? 'drop-shadow(0 0 16px #ff0000) drop-shadow(0 0 32px #ff8800)'
            : 'drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 14px #ff00ff)',
        }}
      >
        {/* Outer guard ring */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="#c0c0c0" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#808080" strokeWidth="1" />

        {/* 4 swept blades — each is a single path, rotated around centre */}
        {[0, 90, 180, 270].map((deg, i) => (
          <g key={deg} transform={`rotate(${deg}, 50, 50)`}>
            {/* Blade shape: swept-back airfoil from hub to tip */}
            <path
              d="M50,50 C46,40 43,28 48,18 C52,15 59,26 57,40 Z"
              fill={colors[i]}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.5"
            />
          </g>
        ))}

        {/* Hub cap */}
        <circle cx="50" cy="50" r="10" fill="#404040" />
        <circle cx="50" cy="50" r="7"  fill="#808080" />
        <circle cx="50" cy="50" r="3"  fill="#c0c0c0" />
      </svg>
    </div>
  );
}

function initialPos() {
  const mobile = isMobile();
  const width = mobile ? window.innerWidth * 0.88 : 260;
  return {
    x: Math.round(window.innerWidth / 2 - width / 2),
    y: Math.max(10, Math.round(window.innerHeight - (mobile ? 280 : 340))),
  };
}

export function Fan() {
  const { temperature, isHot, loading } = useWeather();
  const [speed, setSpeed] = useState(1);
  const [overdrivePhase, setOverdrivePhase] = useState('off');
  const [closed, setClosed] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const chargeRef = useRef(null);
  const [pos, setPos] = useState(initialPos);
  const dragOffset = useRef(null);

  function startDrag(clientX, clientY) {
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
  }

  function moveDrag(clientX, clientY) {
    if (!dragOffset.current) return;
    setPos({
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y,
    });
  }

  function endDrag() {
    dragOffset.current = null;
  }

  function onTitleBarMouseDown(e) {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);

    function onMouseMove(e) { moveDrag(e.clientX, e.clientY); }
    function onMouseUp() {
      endDrag();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onTitleBarTouchStart(e) {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);

    function onTouchMove(e) {
      e.preventDefault();
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    }
    function onTouchEnd() {
      endDrag();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function handleOverdrive() {
    if (overdrivePhase !== 'off') return;
    const chargeDuration = 2000 + Math.random() * 4000;
    const startTime = performance.now();

    setOverdrivePhase('charging');
    setChargeProgress(0);

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / chargeDuration, 1);
      setChargeProgress(progress);

      if (progress < 1) {
        chargeRef.current = requestAnimationFrame(tick);
      } else {
        setOverdrivePhase('launching');
        setTimeout(() => {
          setOverdrivePhase('gone');
          setChargeProgress(0);
        }, 900);
      }
    }

    chargeRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => { if (chargeRef.current) cancelAnimationFrame(chargeRef.current); }, []);

  if (loading || closed) return null;

  const baseDuration = parseFloat(SPEEDS[speed].duration);
  const spinDuration = overdrivePhase === 'off'
    ? SPEEDS[speed].duration
    : `${Math.max(0.04, baseDuration * (1 - chargeProgress) + 0.04 * chargeProgress).toFixed(3)}s`;

  const mobile = isMobile();
  const widgetWidth = mobile ? Math.round(window.innerWidth * 0.88) : 260;

  const btnStyle = (active) => ({
    fontFamily: '"Comic Sans MS", cursive',
    fontWeight: 'bold',
    fontSize: mobile ? '0.5em' : '0.4em',
    padding: mobile ? '8px 12px' : '4px 10px',
    cursor: overdrivePhase === 'off' ? 'pointer' : 'not-allowed',
    background: active ? '#000080' : '#c0c0c0',
    color: active ? '#ffffff' : '#000000',
    ...(active ? win95BorderInset : win95Border),
    letterSpacing: '1px',
    pointerEvents: 'auto',
    opacity: overdrivePhase !== 'off' ? 0.5 : 1,
    touchAction: 'manipulation',
  });

  return (
    <div style={{
      position: 'fixed',
      top: pos.y,
      left: pos.x,
      zIndex: 1000,
      fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
      background: '#c0c0c0',
      ...win95Border,
      width: widgetWidth,
      userSelect: 'none',
      pointerEvents: 'none',
      overflow: 'visible',
    }}>
      {/* Title bar — draggable */}
      <div
        onMouseDown={onTitleBarMouseDown}
        onTouchStart={onTitleBarTouchStart}
        style={{
          background: 'linear-gradient(90deg, #000080, #1084d0)',
          color: '#ffffff',
          fontSize: mobile ? '0.5em' : '0.4em',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          padding: mobile ? '6px 8px' : '3px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          letterSpacing: '0.5px',
          cursor: 'move',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        <span>🌡️ WeatherFan v1.0 - 's-Hertogenbosch</span>
        <span
          onClick={() => setClosed(true)}
          style={{
            background: '#c0c0c0',
            color: '#000',
            fontSize: '1.1em',
            padding: '0 5px',
            ...win95Border,
            cursor: 'pointer',
            lineHeight: '1.4',
            pointerEvents: 'auto',
          }}
        >✕</span>
      </div>

      {/* Body */}
      <div style={{
        padding: mobile ? '10px 12px' : '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: mobile ? '6px' : '8px',
        background: '#c0c0c0',
        overflow: 'visible',
      }}>

        {/* Marquee temperature */}
        <div style={{
          ...win95BorderInset,
          background: '#000080',
          width: '100%',
          overflow: 'hidden',
          padding: '4px 0',
        }}>
          <div style={{
            animation: 'fan-marquee 6s linear infinite',
            whiteSpace: 'nowrap',
            color: '#ffff00',
            fontSize: mobile ? '0.55em' : '0.5em',
            fontWeight: 'bold',
            letterSpacing: '2px',
          }}>
            ★ TEMPERATUUR: {temperature !== null ? `${temperature}°C` : '...'} ★ 's-HERTOGENBOSCH ★ TEMPERATUUR: {temperature !== null ? `${temperature}°C` : '...'} ★ 's-HERTOGENBOSCH ★&nbsp;
          </div>
        </div>

        {isHot && overdrivePhase === 'gone' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
            <div style={{
              fontSize: mobile ? '0.6em' : '0.55em',
              fontWeight: 'bold',
              color: '#cc0000',
              textAlign: 'center',
              letterSpacing: '1px',
            }}>
              💨 FAN IS WEG!!!
            </div>
            <div style={{ fontSize: mobile ? '0.45em' : '0.4em', color: '#000080', textAlign: 'center' }}>
              u heeft de ventilator weggeschoten
            </div>
            <button
              onClick={() => { setOverdrivePhase('off'); setSpeed(1); }}
              style={{
                fontFamily: '"Comic Sans MS", cursive',
                fontWeight: 'bold',
                fontSize: mobile ? '0.5em' : '0.4em',
                padding: mobile ? '8px 14px' : '5px 12px',
                cursor: 'pointer',
                background: '#008000',
                color: '#ffffff',
                ...win95Border,
                letterSpacing: '1px',
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                marginTop: '4px',
              }}
            >
              🛒 NIEUWE FAN KOPEN
            </button>
          </div>
        ) : isHot ? (
          <>
            <div style={{
              color: overdrivePhase !== 'off' ? '#ff6600' : '#ff0000',
              fontSize: mobile ? '0.6em' : '0.55em',
              fontWeight: 'bold',
              animation: overdrivePhase === 'charging'
                ? 'fan-blink 0.2s step-end infinite'
                : 'fan-blink 0.8s step-end infinite',
              letterSpacing: '2px',
              textShadow: '1px 1px 0 #800000',
              textAlign: 'center',
            }}>
              {overdrivePhase === 'charging' ? '🔥 BLAZING FAST ACTIVEREN!!! 🔥' : '⚠️ HET IS HEET!!! ⚠️'}
            </div>

            <FanSvg spinDuration={spinDuration} overdrivePhase={overdrivePhase} />

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {SPEEDS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { if (overdrivePhase === 'off') setSpeed(i); }}
                  style={btnStyle(speed === i && overdrivePhase === 'off')}
                >
                  {s.label}
                </button>
              ))}

              <button
                onClick={handleOverdrive}
                style={{
                  fontFamily: '"Comic Sans MS", cursive',
                  fontWeight: 'bold',
                  fontSize: mobile ? '0.5em' : '0.4em',
                  padding: mobile ? '8px 12px' : '4px 10px',
                  cursor: overdrivePhase === 'off' ? 'pointer' : 'not-allowed',
                  background: overdrivePhase !== 'off' ? '#880000' : '#cc0000',
                  color: '#ffffff',
                  ...(overdrivePhase !== 'off' ? win95BorderInset : win95Border),
                  letterSpacing: '1px',
                  pointerEvents: 'auto',
                  animation: overdrivePhase === 'off' ? 'fan-blink 1.2s step-end infinite' : 'none',
                  textShadow: '1px 1px 0 #000',
                  touchAction: 'manipulation',
                }}
              >
                🔥 BLAZING FAST
              </button>
            </div>

            <div style={{
              fontSize: mobile ? '0.4em' : '0.35em',
              color: '#000080',
              fontWeight: 'bold',
              animation: 'fan-rainbow 2s linear infinite',
            }}>
              ~*~ KLIK OP EEN SNELHEID ~*~
            </div>
          </>
        ) : !isHot ? (
          <div style={{
            color: '#000080',
            fontSize: mobile ? '0.5em' : '0.45em',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '10px 0',
          }}>
            😎 Geen ventilator nodig! 😎
          </div>
        ) : null}
      </div>
    </div>
  );
}
