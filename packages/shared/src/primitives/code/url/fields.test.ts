import { describe, expect, test } from 'vitest';
import { requiredHttpsUrl } from './fields';

describe('requiredHttpsUrl', () => {
  test('accepts https', () => {
    expect(requiredHttpsUrl.safeParse('https://mapa.cultura.gov.br').success).toBe(true);
  });

  test.each(['http://mapa.cultura.gov.br', 'javascript:alert(1)', 'ftp://mapa.cultura.gov.br'])(
    'refuses %s',
    (url) => {
      expect(requiredHttpsUrl.safeParse(url).success).toBe(false);
    },
  );
});
