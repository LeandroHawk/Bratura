import { expect, test } from 'vitest';
import { z } from 'zod';
import { parseWithMessages } from '../../../messages/messages';
import './validation-message';

test('a rule named in meta is the message an enum issue shows, and its key is typed', () => {
  const photoType = z.enum(['image/png']).meta({ validationMessage: 'notAnImage' });
  expect(parseWithMessages(photoType, 'video/mp4', 'en')).toEqual({
    success: false,
    messageByPath: { '': 'Send an image: JPG, PNG, WebP, GIF.' },
  });
  // @ts-expect-error a misspelled key must not compile
  z.string().meta({ validationMessage: 'notAnImag' });
});
