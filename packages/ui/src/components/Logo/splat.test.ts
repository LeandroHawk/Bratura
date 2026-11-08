import { describe, expect, it } from 'vitest';
import { LOGO_SPLAT_SEED, SPLAT_VIEWBOX, smoothClosedPath, splatShapesFromSeed } from './splat';

describe('splatShapesFromSeed', () => {
  it('returns the same shapes for the same seed, so the logo never changes between renders', () => {
    expect(splatShapesFromSeed(LOGO_SPLAT_SEED)).toEqual(splatShapesFromSeed(LOGO_SPLAT_SEED));
  });

  it('returns a different splat for a different seed', () => {
    expect(splatShapesFromSeed(4)).not.toEqual(splatShapesFromSeed(LOGO_SPLAT_SEED));
  });

  it('paints the back blobs before the front one', () => {
    const blobs = splatShapesFromSeed(LOGO_SPLAT_SEED).filter((s) => s.kind === 'path');
    expect(blobs.map((b) => b.tone)).toEqual(['back-left', 'back-right', 'front']);
  });

  it('keeps every drop close to the viewBox', () => {
    const margin = 30;
    for (const s of splatShapesFromSeed(LOGO_SPLAT_SEED)) {
      if (s.kind !== 'circle') continue;
      expect(s.cx).toBeGreaterThan(-margin);
      expect(s.cx).toBeLessThan(SPLAT_VIEWBOX.width + margin);
      expect(s.cy).toBeGreaterThan(-margin);
      expect(s.cy).toBeLessThan(SPLAT_VIEWBOX.height + margin);
    }
  });
});

describe('smoothClosedPath', () => {
  it('starts at the first point, draws one curve per point and closes', () => {
    const d = smoothClosedPath([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);
    expect(d.startsWith('M0 0')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(4);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('refuses fewer than 3 points', () => {
    expect(() =>
      smoothClosedPath([
        [0, 0],
        [1, 1],
      ]),
    ).toThrow();
  });
});
