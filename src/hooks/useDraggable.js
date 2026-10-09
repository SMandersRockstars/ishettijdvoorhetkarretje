import { useCallback, useEffect } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function readSaved(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const { x, y } = JSON.parse(raw);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  } catch {
    return null;
  }
}

function writeSaved(key, x, y) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ x, y }));
  } catch {
    // Storage disabled — dragging still works, it just won't be remembered
  }
}

/**
 * Makes a fixed-position element draggable with pointer events (mouse, touch, pen)
 * and arrow keys, clamped to the viewport and remembered in localStorage.
 *
 * The element starts out anchored by CSS (e.g. `right: 16px; bottom: 76px`). On
 * mount we snapshot that layout position into inline `left`/`top` and drop the
 * anchors, so there is exactly one source of truth from then on. During the drag
 * we write to the DOM directly instead of React state — a 60fps pointer stream
 * should not re-render the tree.
 */
export function useDraggable(ref, { storageKey, enabled = true } = {}) {
  const persist = useCallback(
    (x, y) => writeSaved(storageKey, x, y),
    [storageKey],
  );

  const placeAt = useCallback((x, y) => {
    const el = ref.current;
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }, [ref]);

  // Snapshot the CSS anchor into inline left/top (+ restore any saved position)
  useEffect(() => {
    if (!enabled) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    // offsetLeft/Top ignore the entry animation's transform, unlike getBoundingClientRect
    const maxX = window.innerWidth - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    const saved = readSaved(storageKey);

    placeAt(
      clamp(saved ? saved.x : el.offsetLeft, 0, Math.max(0, maxX)),
      clamp(saved ? saved.y : el.offsetTop, 0, Math.max(0, maxY)),
    );
    return undefined;
  }, [enabled, ref, storageKey, placeAt]);

  // Keep it on screen when the window shrinks
  useEffect(() => {
    if (!enabled) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const onResize = () => {
      const x = clamp(el.offsetLeft, 0, Math.max(0, window.innerWidth - el.offsetWidth));
      const y = clamp(el.offsetTop, 0, Math.max(0, window.innerHeight - el.offsetHeight));
      placeAt(x, y);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled, ref, placeAt]);

  // Pointer drag
  useEffect(() => {
    if (!enabled) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    let drag = null;

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button')) return; // let the close button be clickable

      const rect = el.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        // offsetWidth/Height = layout size; getBoundingClientRect() would fold in
        // the entry animation's scale() and give us the wrong clamp bounds
        width: el.offsetWidth,
        height: el.offsetHeight,
      };

      el.classList.add('is-dragging');
      el.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      placeAt(
        clamp(e.clientX - drag.offsetX, 0, Math.max(0, window.innerWidth - drag.width)),
        clamp(e.clientY - drag.offsetY, 0, Math.max(0, window.innerHeight - drag.height)),
      );
    };

    const onPointerEnd = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      el.classList.remove('is-dragging');
      el.releasePointerCapture?.(e.pointerId);
      persist(parseFloat(el.style.left) || 0, parseFloat(el.style.top) || 0);
      drag = null;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerEnd);
    el.addEventListener('pointercancel', onPointerEnd);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerEnd);
      el.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [enabled, ref, placeAt, persist]);

  // Keyboard nudging (Shift = bigger steps)
  useEffect(() => {
    if (!enabled) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const onKeyDown = (e) => {
      const step = e.shiftKey ? 24 : 6;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;

      e.preventDefault();
      const x = clamp(el.offsetLeft + dx, 0, Math.max(0, window.innerWidth - el.offsetWidth));
      const y = clamp(el.offsetTop + dy, 0, Math.max(0, window.innerHeight - el.offsetHeight));
      placeAt(x, y);
      persist(x, y);
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [enabled, ref, placeAt, persist]);
}
