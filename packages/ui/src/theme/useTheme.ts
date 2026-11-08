'use client';

import { useSyncExternalStore } from 'react';
import { prefersReducedMotion } from '../utils/motion';
import { syncThemeColor, THEME_STORAGE_KEY, type Theme } from './script';

// The <html data-theme> attribute is the single source of truth; every toggle reads it, so two
// toggles on one page always agree.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const themeFromDocument = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, themeFromDocument, () => 'light');
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  syncThemeColor();
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private window): the choice lasts for this page view only.
  }
}

/** Soft edge of the light reveal, in px; must match the 200px in styles.css. */
const LIGHT_EDGE = 200;

/**
 * Switches the theme with a View Transition when the browser supports one. Given the point the
 * light comes from, the light theme spreads out from it when the lights go on and shrinks back into
 * it when they go off. Without an origin it crossfades; with reduced motion it switches at once.
 */
export function switchTheme(next: Theme, lightOrigin?: { x: number; y: number }) {
  const root = document.documentElement;
  if (!document.startViewTransition || prefersReducedMotion()) {
    applyTheme(next);
    return;
  }
  if (!lightOrigin) {
    document.startViewTransition(() => applyTheme(next));
    return;
  }

  const lightsOn = next === 'light';
  const mode = lightsOn ? 'bt-light-on' : 'bt-light-off';
  const { x, y } = lightOrigin;
  const farthestCorner = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const dark = `${-LIGHT_EDGE}px`;
  const lit = `${farthestCorner}px`;

  root.style.setProperty('--bt-reveal-x', `${x}px`);
  root.style.setProperty('--bt-reveal-y', `${y}px`);
  root.style.setProperty('--bt-reveal', lightsOn ? dark : lit);
  root.classList.add(mode);

  const transition = document.startViewTransition(() => applyTheme(next));
  transition.ready.then(() => {
    root.animate(
      { '--bt-reveal': lightsOn ? [dark, lit] : [lit, dark] },
      {
        duration: lightsOn ? 900 : 700,
        easing: lightsOn ? 'cubic-bezier(0.2, 0.6, 0.3, 1)' : 'cubic-bezier(0.6, 0, 0.8, 0.4)',
        fill: 'forwards',
        pseudoElement: lightsOn ? '::view-transition-new(root)' : '::view-transition-old(root)',
      },
    );
  });
  transition.finished.finally(() => {
    root.classList.remove(mode);
    root.style.removeProperty('--bt-reveal');
    root.style.removeProperty('--bt-reveal-x');
    root.style.removeProperty('--bt-reveal-y');
  });
}
