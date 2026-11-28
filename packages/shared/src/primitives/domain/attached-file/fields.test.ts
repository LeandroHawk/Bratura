import { describe, expect, test } from 'vitest';
import {
  AttachedFileSchema,
  attachedFileMaxSizeInBytes,
  attachedVideoMaxDurationInSeconds,
} from './fields';

const photo = { fileName: 'show.jpg', mediaType: 'image/jpeg', sizeInBytes: 1024 };
const video = {
  fileName: 'show.mp4',
  mediaType: 'video/mp4',
  sizeInBytes: 1024,
  durationInSeconds: 30,
};

describe('AttachedFileSchema', () => {
  test.each([
    ['a photo', photo],
    ['a video', video],
    ['exactly 25 MB', { ...photo, sizeInBytes: attachedFileMaxSizeInBytes }],
    ['exactly 60 seconds', { ...video, durationInSeconds: attachedVideoMaxDurationInSeconds }],
    ['a PDF', { fileName: 'cert.pdf', mediaType: 'application/pdf', sizeInBytes: 10 }],
  ])('accepts %s', (_case, file) => {
    expect(AttachedFileSchema.safeParse(file).success).toBe(true);
  });

  test.each([
    [
      'a byte over 25 MB',
      { ...photo, sizeInBytes: attachedFileMaxSizeInBytes + 1 },
      'fileTooLarge',
    ],
    ['a video over 60 seconds', { ...video, durationInSeconds: 60.01 }, 'videoTooLong'],
  ])('refuses %s, naming its rule', (_case, file, rule) => {
    const parsed = AttachedFileSchema.safeParse(file);
    expect(parsed.success).toBe(false);
    expect(
      parsed.error?.issues.map(
        (issue) => (issue as { params?: { message?: string } }).params?.message,
      ),
    ).toContain(rule);
  });
});

test('the union requires video metadata and excludes unknown media types', () => {
  const missing = AttachedFileSchema.safeParse({ ...video, durationInSeconds: undefined });
  expect(missing.success).toBe(false);
  expect(missing.error?.issues).toEqual([
    expect.objectContaining({ code: 'invalid_type', path: ['durationInSeconds'] }),
  ]);
  for (const mediaType of ['', 'application/x-msdownload']) {
    const parsed = AttachedFileSchema.safeParse({ ...photo, mediaType });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.code).toBe('invalid_union');
  }
});

test('storage keys accept UUIDs and refuse arbitrary text', () => {
  expect(
    AttachedFileSchema.safeParse({ ...photo, storageKey: 'ad297934-2a12-42c7-b607-c85801f54f2d' })
      .success,
  ).toBe(true);
  expect(AttachedFileSchema.safeParse({ ...photo, storageKey: 'any-text' }).success).toBe(false);
});
