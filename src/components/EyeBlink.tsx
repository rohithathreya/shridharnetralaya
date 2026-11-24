import { useEffect } from 'react';

const DURATION = 1600;

function motionOk() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Plays once per full page load. Swipes and in-app route changes do not replay it. */
let played = false;

export function EyeBlink() {
  useEffect(() => {
    if (!motionOk() || played) return;
    const root = document.getElementById('root');
    if (!root) return;
    played = true;

    const focus = root.animate(
      [
        { filter: 'blur(14px) brightness(0.86) saturate(0.9)', offset: 0 },
        { filter: 'blur(0px) brightness(1) saturate(1)', offset: 1, easing: 'cubic-bezier(0.22, 0.8, 0.2, 1)' },
      ],
      { duration: DURATION, fill: 'forwards' },
    );

    const clear = window.setTimeout(() => {
      focus.cancel();
      root.style.filter = '';
    }, DURATION + 40);

    return () => window.clearTimeout(clear);
  }, []);

  return null;
}
