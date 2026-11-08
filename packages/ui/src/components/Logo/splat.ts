/**
 * The logo's paint splat: three overlapping blobs (blue and green behind, yellow in front),
 * each with a few arms ending in a drop. Generated from a seed so it is identical on every
 * render, server or client. Coordinates live in a 360 x 150 viewBox.
 */

export type SplatTone = 'front' | 'back-left' | 'back-right';

export type SplatShape =
  | { kind: 'path'; d: string; tone: SplatTone }
  | { kind: 'circle'; cx: number; cy: number; r: number; tone: SplatTone };

export const SPLAT_VIEWBOX = { width: 360, height: 150 } as const;

/** Seed the team picked ("Respingo colorido, versão 3"). */
export const LOGO_SPLAT_SEED = 3;

const CENTER_X = 180;
const CENTER_Y = 62;

export function splatShapesFromSeed(seed: number): SplatShape[] {
  const random = randomFromSeed(seed);
  // Order matters: it fixes how the seed's numbers are consumed, and back blobs paint first.
  return [
    ...blob(random, CENTER_X - 70, CENTER_Y - 12, 96, 34, 'back-left'),
    ...blob(random, CENTER_X + 78, CENTER_Y + 14, 92, 32, 'back-right'),
    ...blob(random, CENTER_X, CENTER_Y, 140, 38, 'front'),
  ];
}

function blob(
  random: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tone: SplatTone,
): SplatShape[] {
  const pointCount = 30;
  const points: Array<[number, number]> = [];
  const drops: SplatShape[] = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let reach = (random() - 0.5) * 6;
    if (i % 5 === 2 && random() < 0.75) {
      reach = 10 + random() * 12;
      drops.push({
        kind: 'circle',
        cx: round1(cx + cos * (rx + reach * 0.6 + 12)),
        cy: round1(cy + sin * (ry + reach + 12)),
        r: round1(2 + random() * 3),
        tone,
      });
    }
    points.push([cx + cos * (rx + reach * 0.6), cy + sin * (ry + reach)]);
  }
  return [{ kind: 'path', d: smoothClosedPath(points), tone }, ...drops];
}

/** Closed Catmull-Rom spline through the points, written as cubic Bézier segments. */
export function smoothClosedPath(points: ReadonlyArray<readonly [number, number]>): string {
  const n = points.length;
  if (n < 3) throw new Error('A closed path needs at least 3 points');
  const at = (i: number) => points[((i % n) + n) % n] as readonly [number, number];
  const [x0, y0] = at(0);
  let d = `M${round1(x0)} ${round1(y0)}`;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = at(i - 1);
    const [bx, by] = at(i);
    const [cx, cy] = at(i + 1);
    const [ex, ey] = at(i + 2);
    d +=
      `C${round1(bx + (cx - ax) / 6)} ${round1(by + (cy - ay) / 6)} ` +
      `${round1(cx - (ex - bx) / 6)} ${round1(cy - (ey - by) / 6)} ${round1(cx)} ${round1(cy)}`;
  }
  return `${d}Z`;
}

/** mulberry32: small, fast, deterministic PRNG returning floats in [0, 1). */
export function randomFromSeed(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
