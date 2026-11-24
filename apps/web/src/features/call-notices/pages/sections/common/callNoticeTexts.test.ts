import { describe, expect, test } from 'vitest';
import { closeText } from './callNoticeTexts';

describe('closeText', () => {
  test.each([
    ['pt-BR', 'sem data de encerramento'],
    ['en', 'no closing date'],
  ] as const)('an open-ended call reads its close in %s', (locale, text) => {
    expect(closeText({ deadline: 'openEnded', registrationCloses: null }, locale)).toBe(text);
  });
});
