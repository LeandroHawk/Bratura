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
 * Sets dark on `<html>` when the visitor chose it (light is the default; blocked storage is ignored).
 * Run from `<head>` by `themeInitScript` and on mount for client-rendered documents. Inlined as
 * source text, so it may touch only its arguments and browser globals.
 */
export function restoreSavedTheme(storageKey = THEME_STORAGE_KEY, syncColor = syncThemeColor) {
  try {
    if (localStorage.getItem(storageKey) !== 'dark') return;
    document.documentElement.dataset.theme = 'dark';
    // While <head> is parsing, the theme-color meta is not in the document yet.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncColor);
    else syncColor();
  } catch {
    // Storage blocked (private window): the default light theme stays.
  }
}

/** Inline this in <head> so a visitor who chose dark never sees a flash of the light theme. */
export const themeInitScript = `(${restoreSavedTheme.toString()})('${THEME_STORAGE_KEY}',${syncThemeColor.toString()})`;
