import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatioFromHex } from '../utils/contrast';
import { LIGHT_THEME_COLORS } from './palette';
import { COLOR_TOKENS, CONTRAST_PAIRS } from './tokens';

// tokens.css is the single source of the token values; these tests read it as text.
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

/** Every file of the package with the given extensions, relative to src/. */
function sourceFiles(pattern: RegExp): string[] {
  return readdirSync(new URL('../', import.meta.url), { recursive: true, encoding: 'utf8' }).filter(
    (f) => pattern.test(f) && !f.includes('.test.'),
  );
}
const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

function declarationsIn(pattern: RegExp): Map<string, string> {
  const body = css.match(pattern)?.[1];
  if (!body) throw new Error(`Block not found: ${pattern}`);
  return new Map(
    [...body.matchAll(/--bt-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]),
  );
}

const primitives = declarationsIn(/\/\* Primitives \*\/\s*:root\s*\{([^}]*)\}/);
const semantic = {
  light: declarationsIn(/\[data-theme='light'\]\s*\{([^}]*)\}/),
  dark: declarationsIn(/\[data-theme='dark'\]\s*\{([^}]*)\}/),
};

/** Follows var(--bt-x) to the primitive's hex value. */
function hexOf(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(name);
  const ref = value?.match(/^var\(--bt-([\w-]+)\)$/)?.[1];
  const hex = ref ? primitives.get(ref) : undefined;
  if (!hex) throw new Error(`--bt-${name} does not point at a primitive (got ${value})`);
  return hex;
}

describe('primitive tokens', () => {
  it('are plain hex colors', () => {
    for (const [name, value] of primitives) expect(value, `--bt-${name}`).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('semantic tokens', () => {
  it('define the same names in both themes', () => {
    expect([...semantic.dark.keys()].sort()).toEqual([...semantic.light.keys()].sort());
  });

  it.each(Object.entries(semantic))('%s theme points every token at a primitive', (_, tokens) => {
    for (const name of tokens.keys()) expect(() => hexOf(tokens, name)).not.toThrow();
  });

  it.each(COLOR_TOKENS.map((t) => t.name))('documents --bt-%s, which exists', (name) => {
    expect(semantic.light.has(name)).toBe(true);
  });

  it('keeps the TypeScript copy of the light palette equal to tokens.css', () => {
    for (const [name, value] of Object.entries(LIGHT_THEME_COLORS)) {
      expect(hexOf(semantic.light, name), `--bt-${name}`).toBe(value);
    }
  });

  describe.each(Object.entries(semantic))('%s theme', (_, tokens) => {
    it.each(CONTRAST_PAIRS.map((p) => [p.fg, p.bg, p.min] as const))(
      '%s on %s reaches %s:1',
      (fg, bg, min) => {
        expect(contrastRatioFromHex(hexOf(tokens, fg), hexOf(tokens, bg))).toBeGreaterThanOrEqual(
          min,
        );
      },
    );
  });
});

describe('component code', () => {
  it('never reaches for a primitive directly', () => {
    const primitiveRef = new RegExp(`--bt-(${[...primitives.keys()].join('|')})\\b`);
    const files = sourceFiles(/^components\/.*\.(tsx|css)$/);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) expect(read(file), file).not.toMatch(primitiveRef);
  });

  it('defaults to light: no stylesheet switches to dark by OS preference alone', () => {
    for (const file of sourceFiles(/\.css$/))
      expect(read(file), file).not.toMatch(/prefers-color-scheme/);
  });
});
