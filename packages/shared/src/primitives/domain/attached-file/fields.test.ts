import { describe, expect, test } from 'vitest';
import {
  AttachedFileSchema,
  AttachedImageSchema,
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
    [
      'a type it does not keep',
      { ...photo, mediaType: 'application/x-msdownload' },
      'unsupportedFileType',
    ],
    ['a type the browser could not tell', { ...photo, mediaType: '' }, 'unsupportedFileType'],
    [
      'a video whose length could not be read',
      { ...video, durationInSeconds: undefined },
      'unreadableFile',
    ],
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

describe('AttachedImageSchema', () => {
  test('accepts a photo and refuses a video, a PDF', () => {
    expect(AttachedImageSchema.safeParse(photo).success).toBe(true);
    expect(AttachedImageSchema.safeParse(video).success).toBe(false);
    expect(AttachedImageSchema.safeParse({ ...photo, mediaType: 'application/pdf' }).success).toBe(
      false,
    );
  });
});
