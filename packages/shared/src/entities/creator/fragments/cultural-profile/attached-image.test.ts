import { expect, test } from 'vitest';
import { AttachedImageSchema, AttachedImageMediaTypeEnum } from './attached-image';

test('a profile photo derives the non-video file contract and accepts only image media types', () => {
  const photo = { fileName: 'photo.jpg', mediaType: 'image/jpeg', sizeInBytes: 1 };
  expect(AttachedImageMediaTypeEnum.options).toEqual([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);
  expect(AttachedImageSchema.safeParse(photo).success).toBe(true);
  for (const mediaType of ['video/mp4', 'application/pdf', ''])
    expect(AttachedImageSchema.safeParse({ ...photo, mediaType }).success).toBe(false);
  expect(AttachedImageSchema.parse({ ...photo, durationInSeconds: 30 })).not.toHaveProperty(
    'durationInSeconds',
  );
});
