import { describe, expect, test } from 'vitest';
import { z } from 'zod';

// Convex builds a table from the input side of a conversion, so an entity holds none: why and where
// converting goes instead, `packages/shared/AGENTS.md`, Errors, invariants. `.trim()` keeps the type.
const entityModules = import.meta.glob(['./**/entity.ts', './**/variant.ts', './**/fields.ts'], {
  eager: true,
});

function conversionsIn(schema: z.core.$ZodType, path: string): string[] {
  const def = schema._zod.def;
  switch (def.type) {
    case 'pipe':
    case 'transform':
      return [`${path} (${def.type})`];
    case 'object':
      return Object.entries((def as z.core.$ZodObjectDef).shape).flatMap(([key, field]) =>
        conversionsIn(field, `${path}.${key}`),
      );
    case 'union':
      return (def as z.core.$ZodUnionDef).options.flatMap((option, index) =>
        conversionsIn(option, `${path}|${index}`),
      );
    case 'array':
      return conversionsIn((def as z.core.$ZodArrayDef).element, `${path}[]`);
    case 'optional':
    case 'nullable':
    case 'default':
    case 'readonly':
      return conversionsIn((def as z.core.$ZodOptionalDef).innerType, path);
    default:
      return [];
  }
}

describe('entities', () => {
  test('the guard reads every entity module', () => {
    expect(Object.keys(entityModules).length).toBeGreaterThanOrEqual(10);
  });

  test('no entity field converts its value', () => {
    const conversions = Object.entries(entityModules).flatMap(([file, module]) =>
      Object.entries(module as Record<string, unknown>)
        .filter((entry): entry is [string, z.core.$ZodType] => entry[1] instanceof z.core.$ZodType)
        .flatMap(([name, schema]) => conversionsIn(schema, `${file}:${name}`)),
    );
    expect(conversions).toEqual([]);
  });

  test('the guard catches a conversion', () => {
    const converting = z.object({ amount: z.preprocess(Number, z.number()).nullable() });
    expect(conversionsIn(converting, 'probe')).toEqual(['probe.amount (pipe)']);
  });
});

declare global {
  interface ImportMeta {
    glob(patterns: string[], options: { eager: true }): Record<string, unknown>;
  }
}
