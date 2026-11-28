import {
  AttachedFileSchema,
  attachedFileMaxSizeInBytes,
} from '@bratura/shared/primitives/domain/attached-file/fields';
import { AttachedFileMediaTypeEnum } from '@bratura/shared/primitives/domain/attached-file/enum';
import {
  AttachedImageSchema,
  AttachedImageMediaTypeEnum,
} from '@bratura/shared/entities/creator/fragments/cultural-profile/attached-image';
import { ruleMessage } from '@bratura/shared/messages/messages';
import { textLengths } from '@bratura/shared/primitives/code/string/fields';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  mediaTypeFromLeadingBytes,
  attachedFileFromBrowserFile,
  durationBeforeTimeout,
  acceptedMediaTypes,
} from './attached-file.mapper';

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

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test.each(['heic', 'avif', 'zzzz'])('an unrecognised ftyp %s brand is not a video', (brand) => {
  expect(mediaTypeFromLeadingBytes(bytes([0, 0, 0, 24], `ftyp${brand}`))).toBeNull();
});

test.each([
  'isom',
  'iso2',
  'iso3',
  'iso4',
  'iso5',
  'iso6',
  'mp41',
  'mp42',
  'avc1',
  'M4V ',
  '3gp4',
  '3gp5',
  '3gp6',
  'dash',
])('recognises MP4 brand %s', (brand) => {
  expect(mediaTypeFromLeadingBytes(bytes([0, 0, 0, 24], `ftyp${brand}`))).toBe('video/mp4');
});

test('metadata that never arrives resolves null after exactly ten seconds', async () => {
  vi.useFakeTimers();
  const result = durationBeforeTimeout(new Promise(() => {}));
  const completed = vi.fn();
  void result.then(completed);
  await vi.advanceTimersByTimeAsync(9999);
  expect(completed).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await expect(result).resolves.toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

test.each([12, null])(
  'metadata result %s wins the deadline and clears its timer',
  async (seconds) => {
    vi.useFakeTimers();
    await expect(durationBeforeTimeout(Promise.resolve(seconds))).resolves.toBe(seconds);
    expect(vi.getTimerCount()).toBe(0);
  },
);

test('a rejected metadata read also clears its timer', async () => {
  vi.useFakeTimers();
  await expect(durationBeforeTimeout(Promise.reject(new Error('read failed')))).rejects.toThrow(
    'read failed',
  );
  expect(vi.getTimerCount()).toBe(0);
});

test.each(['pt-BR', 'en'] as const)(
  'unknown bytes get the schema’s own refusal in %s',
  async (locale) => {
    const file = new File(['MZ-not-a-photo'], 'renamed.jpg');
    for (const [schema, message] of [
      [AttachedFileSchema, 'unsupportedFileType'],
      [AttachedImageSchema, 'notAnImage'],
    ] as const) {
      expect(await attachedFileFromBrowserFile(file, schema, locale)).toEqual({
        success: false,
        messageByPath: { mediaType: ruleMessage(message, locale) },
      });
    }
  },
);

test('the accept lists are derived from the file field’s media type enums', () => {
  expect(acceptedMediaTypes(AttachedFileSchema).toSorted()).toEqual(
    AttachedFileMediaTypeEnum.options.toSorted(),
  );
  expect(acceptedMediaTypes(AttachedImageSchema)).toEqual(AttachedImageMediaTypeEnum.options);
});

test.each([
  ['pt-BR', 'arquivo'],
  ['en', 'file'],
] as const)('unnamed files use the %s fallback', async (locale, fileName) => {
  const result = await attachedFileFromBrowserFile(
    new File(['%PDF-1.7'], ''),
    AttachedFileSchema,
    locale,
  );
  expect(result).toEqual({
    success: true,
    value: { fileName, mediaType: 'application/pdf', sizeInBytes: 8 },
  });
});

test('the contract’s medium ceiling bounds an attached file name', async () => {
  const result = await attachedFileFromBrowserFile(
    new File(['%PDF-1.7'], 'x'.repeat(textLengths.medium + 1)),
    AttachedFileSchema,
    'en',
  );
  expect(result.success && result.value.fileName).toBe('x'.repeat(textLengths.medium));
});

test('oversized files are refused before signature or video metadata is read', async () => {
  const slice = vi.fn(() => {
    throw new Error('must not read');
  });
  const file = { name: 'huge.mp4', size: attachedFileMaxSizeInBytes + 1, slice } as unknown as File;
  expect(await attachedFileFromBrowserFile(file, AttachedFileSchema, 'pt-BR')).toEqual({
    success: false,
    messageByPath: { '': ruleMessage('fileTooLarge', 'pt-BR') },
  });
  expect(slice).not.toHaveBeenCalled();
});

test.each(['metadata', 'error', 'timeout'] as const)(
  'video %s releases its element and object URL',
  async (path) => {
    vi.useFakeTimers();
    const player = {
      duration: 5,
      preload: '',
      onloadedmetadata: null as null | (() => void),
      onerror: null as null | (() => void),
      src: '',
      removeAttribute: vi.fn(),
      load: vi.fn(),
      remove: vi.fn(),
    };
    vi.stubGlobal('document', { createElement: () => player });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const result = attachedFileFromBrowserFile(
      new File([bytes([0, 0, 0, 24], 'ftypisom')], 'clip.mp4'),
      AttachedFileSchema,
      'en',
    );
    // File.arrayBuffer is asynchronous even with fake timers.
    await vi.waitFor(() => expect(player.src).toBe('blob:test'));
    if (path === 'metadata') player.onloadedmetadata!();
    else if (path === 'error') player.onerror!();
    else await vi.advanceTimersByTimeAsync(10_000);
    const parsed = await result;
    if (path === 'metadata')
      expect(parsed).toEqual({
        success: true,
        value: {
          fileName: 'clip.mp4',
          mediaType: 'video/mp4',
          sizeInBytes: 12,
          durationInSeconds: 5,
        },
      });
    else
      expect(parsed).toEqual({
        success: false,
        messageByPath: { '': ruleMessage('unreadableFile', 'en') },
      });
    expect(revoke).toHaveBeenCalledWith('blob:test');
    expect(player.removeAttribute).toHaveBeenCalledWith('src');
    expect(player.load).toHaveBeenCalledOnce();
    expect(player.remove).toHaveBeenCalledOnce();
    expect(player.onloadedmetadata).toBeNull();
    expect(player.onerror).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  },
);
