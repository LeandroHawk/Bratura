import { describe, expect, test } from 'vitest';
import { ArtFormEnum } from '../../../call-notice-extraction/entity';
import { CulturalAreaEnum } from './enum';

describe('CulturalAreaEnum', () => {
  test('carries every art form a call can name, so no call is out of reach of a creator', () => {
    const artForms = ArtFormEnum.options.filter((artForm) => artForm !== 'any');
    expect(CulturalAreaEnum.options).toEqual(expect.arrayContaining(artForms));
  });

  test('leaves out `any`: a creator works in named areas', () => {
    expect(CulturalAreaEnum.safeParse('any').success).toBe(false);
  });
});
