export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bratura-theme';

/**
 * Points the mobile browser bar (meta theme-color) at the current theme's background. Used after a
 * toggle and, as source text, inside `themeInitScript`: it must only touch browser globals.
 */
export function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  const background = getComputedStyle(document.documentElement)
    .getPropertyValue('--bt-background')
    .trim();
  if (meta && background) meta.setAttribute('content', background);
}

/**
 * Inline this in <head>, before the page paints, so a visitor who chose dark never sees a flash of
 * the light theme. Light is the default; storage may be blocked, so failures are ignored. Once the
 * document has loaded, the browser bar follows the dark background (`syncThemeColor`).
 */
export const themeInitScript =
  `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark'){` +
  `document.documentElement.dataset.theme='dark';` +
  `document.addEventListener('DOMContentLoaded',${syncThemeColor.toString()})}}catch(e){}`;
