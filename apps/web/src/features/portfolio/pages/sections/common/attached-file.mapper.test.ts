import { describe, expect, test } from 'vitest';
import { mediaTypeFromLeadingBytes } from './attached-file.mapper';

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === 'string' ? [...part].map((char) => char.charCodeAt(0)) : part,
    ),
  );

describe('mediaTypeFromLeadingBytes', () => {
  test.each([
    ['JPEG', bytes([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg'],
    ['PNG', bytes([0x89], 'PNG', [0x0d, 0x0a, 0x1a, 0x0a]), 'image/png'],
    ['GIF', bytes('GIF89a'), 'image/gif'],
    ['WebP', bytes('RIFF', [0, 0, 0, 0], 'WEBP'), 'image/webp'],
    ['MP4', bytes([0, 0, 0, 0x18], 'ftypisom'), 'video/mp4'],
    ['MOV', bytes([0, 0, 0, 0x14], 'ftypqt  '), 'video/quicktime'],
    ['M4A', bytes([0, 0, 0, 0x20], 'ftypM4A '), 'audio/mp4'],
    ['WebM', bytes([0x1a, 0x45, 0xdf, 0xa3]), 'video/webm'],
    ['MP3', bytes('ID3', [4, 0]), 'audio/mpeg'],
    ['OGG', bytes('OggS'), 'audio/ogg'],
    ['WAV', bytes('RIFF', [0, 0, 0, 0], 'WAVE'), 'audio/wav'],
    ['PDF', bytes('%PDF-1.7'), 'application/pdf'],
  ])('reads %s from its signature', (_case, leading, mediaType) => {
    expect(mediaTypeFromLeadingBytes(leading)).toBe(mediaType);
  });

  test.each([
    ['a Windows program renamed .jpg', bytes('MZ', [0x90, 0])],
    ['plain text', bytes('hello world')],
    ['an empty file', bytes()],
  ])('is null for %s', (_case, leading) => {
    expect(mediaTypeFromLeadingBytes(leading)).toBeNull();
  });
});
