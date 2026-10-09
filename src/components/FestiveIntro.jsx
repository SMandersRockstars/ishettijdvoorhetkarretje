import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SEEN_KEY = 'karretje:introSeen';

function hasSeenIntro(themeKey) {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === themeKey;
  } catch {
    return false;
  }
}

function markIntroSeen(themeKey) {
  try {
    window.sessionStorage.setItem(SEEN_KEY, themeKey);
  } catch {
    // Private mode / storage disabled — the intro just shows again next reload
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * The festive intro clip that used to be bolted onto the DOM by the vanilla-JS
 * `init()` function. Declarative equivalent: it renders itself when the active
 * theme has an `intro` asset and the user has unlocked the full experience,
 * ducks the background music while it plays, and gets out of the way when closed.
 *
 * Two behaviours, chosen per theme via `theme.intro.loop`:
 *   loop: true  — ambient corner overlay, plays with sound indefinitely.
 *                 Use when the clip is the theme's only soundtrack (halloween).
 *   loop: false — centred one-shot, dismissed automatically when it ends.
 *
 * Dismissed state is remembered per theme per browser session. Skipped entirely
 * for prefers-reduced-motion.
 */
export function FestiveIntro() {
  const { theme, currentThemeKey, initialized, isFestive, setDucked } = useTheme();
  const intro = theme.intro;
  const loop = Boolean(intro?.loop);
  const [dismissed, setDismissed] = useState(() => hasSeenIntro(currentThemeKey));
  const videoRef = useRef(null);

  // A new festivity gets its own intro, even later in the same session
  useEffect(() => {
    setDismissed(hasSeenIntro(currentThemeKey));
  }, [currentThemeKey]);

  const skip = useCallback(() => {
    markIntroSeen(currentThemeKey);
    setDismissed(true);
  }, [currentThemeKey]);

  const reducedMotion = usePrefersReducedMotion();
  const visible = Boolean(initialized && isFestive && intro && !dismissed && !reducedMotion);

  // Let the intro clip have the speakers, then hand them back
  useEffect(() => {
    if (!visible) return undefined;
    setDucked(true);
    return () => setDucked(false);
  }, [visible, setDucked]);

  useEffect(() => {
    if (!visible) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, skip]);

  // Autoplay with sound can still be refused; don't leave a dead box on screen
  useEffect(() => {
    if (!visible) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    const timer = setTimeout(() => {
      if (video.paused && video.readyState < 3) skip();
    }, 4000);
    return () => clearTimeout(timer);
  }, [visible, skip]);

  if (!visible) return null;

  return (
    <div
      className={`festive-intro ${loop ? 'festive-intro--ambient' : 'festive-intro--oneshot'}`}
      role="dialog"
      aria-label={`${theme.name} intro`}
    >
      <video
        ref={videoRef}
        className="festive-intro-video"
        src={intro.src}
        poster={intro.poster}
        autoPlay
        playsInline
        loop={loop}
        onEnded={loop ? undefined : skip}
        onError={skip}
      />
      <div className="festive-intro-caption">{intro.caption ?? theme.name}</div>
      <button type="button" className="festive-intro-skip" onClick={skip} autoFocus title="Sluit intro">
        ✕
      </button>
    </div>
  );
}
