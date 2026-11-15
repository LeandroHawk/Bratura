import { describe, expect, test } from 'vitest';
import { requiredCpf } from './fields';

describe('requiredCpf', () => {
  test('takes a number whose check digits match', () => {
    expect(requiredCpf.safeParse('52998224725').success).toBe(true);
  });

  test('refuses a wrong check digit', () => {
    expect(requiredCpf.safeParse('52998224724').success).toBe(false);
  });

  test('refuses eleven equal digits, which pass the arithmetic', () => {
    expect(requiredCpf.safeParse('11111111111').success).toBe(false);
  });

  test('refuses the masked form: the edge strips it', () => {
    expect(requiredCpf.safeParse('529.982.247-25').success).toBe(false);
  });

  test('names its message instead of writing one', () => {
    expect(requiredCpf.safeParse('123').error?.issues[0]).toMatchObject({
      code: 'custom',
      params: { message: 'cpf' },
    });
  });
});
