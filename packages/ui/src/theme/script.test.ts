import { afterEach, describe, expect, it, vi } from 'vitest';
import { restoreSavedTheme, THEME_STORAGE_KEY, themeInitScript } from './script';

/** Runs the inline script against a fake browser; returns what it changed. */
function runInit(getItem: (key: string) => string | null) {
  const meta = { content: '#f3ead8', setAttribute: (_: string, v: string) => (meta.content = v) };
  let onLoad: (() => void) | undefined;
  const document = {
    documentElement: { dataset: {} as Record<string, string> },
    readyState: 'loading',
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

describe('restoreSavedTheme, called when React renders the document in the browser', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubBrowser(saved: string | null) {
    const dataset: Record<string, string> = {};
    vi.stubGlobal('localStorage', { getItem: () => saved });
    vi.stubGlobal('document', { documentElement: { dataset }, readyState: 'complete' });
    return dataset;
  }

  it('applies dark and syncs the browser bar at once, the document being loaded', () => {
    const dataset = stubBrowser('dark');
    const syncColor = vi.fn();
    restoreSavedTheme(THEME_STORAGE_KEY, syncColor);
    expect(dataset.theme).toBe('dark');
    expect(syncColor).toHaveBeenCalledOnce();
  });

  it('leaves light alone when nothing was chosen', () => {
    const dataset = stubBrowser(null);
    const syncColor = vi.fn();
    restoreSavedTheme(THEME_STORAGE_KEY, syncColor);
    expect(dataset.theme).toBeUndefined();
    expect(syncColor).not.toHaveBeenCalled();
  });
});
