import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, themeInitScript } from './script';

/** Runs the inline script against a fake browser; returns what it changed. */
function runInit(getItem: (key: string) => string | null) {
  const meta = { content: '#f3ead8', setAttribute: (_: string, v: string) => (meta.content = v) };
  let onLoad: (() => void) | undefined;
  const document = {
    documentElement: { dataset: {} as Record<string, string> },
    addEventListener: (_: string, fn: () => void) => (onLoad = fn),
    querySelector: () => meta,
  };
  const getComputedStyle = () => ({
    getPropertyValue: () => (document.documentElement.dataset.theme === 'dark' ? ' #2b1b12' : ''),
  });
  new Function('localStorage', 'document', 'getComputedStyle', themeInitScript)(
    { getItem },
    document,
    getComputedStyle,
  );
  onLoad?.();
  return { theme: document.documentElement.dataset.theme, barColor: meta.content };
}

describe('themeInitScript', () => {
  it('applies dark, and the dark browser bar color, only when the visitor chose it', () => {
    expect(runInit((key) => (key === THEME_STORAGE_KEY ? 'dark' : null))).toEqual({
      theme: 'dark',
      barColor: '#2b1b12',
    });
  });

  it('leaves the default light theme when nothing was chosen', () => {
    expect(runInit(() => null)).toEqual({ theme: undefined, barColor: '#f3ead8' });
  });

  it('does not break the page when storage is blocked', () => {
    expect(
      runInit(() => {
        throw new Error('SecurityError');
      }).theme,
    ).toBeUndefined();
  });
});
