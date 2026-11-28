import {
  parseWithMessages,
  ruleMessage,
  type ParsedWithMessages,
} from '@bratura/shared/messages/messages';
import {
  AttachedFileSchema,
  attachedFileMaxSizeInBytes,
  type AttachedFile,
} from '@bratura/shared/primitives/domain/attached-file/fields';
import {
  attachedFileKindByMediaType,
  type AttachedFileMediaType,
} from '@bratura/shared/primitives/domain/attached-file/enum';
import { AttachedImageSchema } from '@bratura/shared/entities/creator/fragments/cultural-profile/attached-image';
import { textLengths } from '@bratura/shared/primitives/code/string/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { PORTFOLIO_COMMON_CONTENT } from '@/features/portfolio/pages/sections/common/content';

export type AttachedFileInputSchema = typeof AttachedFileSchema | typeof AttachedImageSchema;

export function acceptedMediaTypes(schema: AttachedFileInputSchema): AttachedFileMediaType[] {
  return 'options' in schema
    ? schema.options.flatMap((variant) => variant.shape.mediaType.options)
    : schema.shape.mediaType.options;
}

const textAt = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/**
 * The type a file really is, read from its first bytes (its signature), or `null` when it is none
 * the portfolio keeps: a renamed `.exe` called `photo.jpg` is not taken for a photo.
 */
export function mediaTypeFromLeadingBytes(bytes: Uint8Array): AttachedFileMediaType | null {
  const startsWith = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  if (startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (textAt(bytes, 0, 6) === 'GIF87a' || textAt(bytes, 0, 6) === 'GIF89a') return 'image/gif';
  if (textAt(bytes, 0, 4) === 'RIFF' && textAt(bytes, 8, 4) === 'WEBP') return 'image/webp';
  if (textAt(bytes, 0, 4) === 'RIFF' && textAt(bytes, 8, 4) === 'WAVE') return 'audio/wav';
  if (textAt(bytes, 0, 5) === '%PDF-') return 'application/pdf';
  if (textAt(bytes, 0, 4) === 'OggS') return 'audio/ogg';
  if (startsWith(0x1a, 0x45, 0xdf, 0xa3)) return 'video/webm';
  if (textAt(bytes, 4, 4) === 'ftyp') {
    const brand = textAt(bytes, 8, 4);
    if (brand === 'qt  ') return 'video/quicktime';
    if (brand === 'M4A ' || brand === 'M4B ') return 'audio/mp4';
    return [
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
    ].includes(brand)
      ? 'video/mp4'
      : null;
  }
  if (textAt(bytes, 0, 3) === 'ID3' || (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0))
    return 'audio/mpeg';
  return null;
}

/** Metadata that never arrives stops holding the form open after ten seconds. */
export async function durationBeforeTimeout(
  metadata: Promise<number | null>,
): Promise<number | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      metadata,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 10_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Reads metadata with a deadline, releasing the player and object URL on every exit. */
async function videoDurationInSeconds(file: Blob): Promise<number | null> {
  const video = document.createElement('video');
  const url = URL.createObjectURL(file);
  try {
    const metadata = new Promise<number | null>((resolve) => {
      video.preload = 'metadata';
      video.onloadedmetadata = () =>
        resolve(Number.isFinite(video.duration) ? video.duration : null);
      video.onerror = () => resolve(null);
      video.src = url;
    });
    return await durationBeforeTimeout(metadata);
  } finally {
    video.onloadedmetadata = null;
    video.onerror = null;
    video.removeAttribute('src');
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

/** Whether the browser can draw the image: a damaged one with a valid signature still fails. */
async function isDrawableImage(file: Blob): Promise<boolean> {
  try {
    (await createImageBitmap(file)).close();
    return true;
  } catch {
    return false;
  }
}

/**
 * A file the person picked, read for what it really is (type from its bytes, a video's length from
 * its player) and checked by the contract field it goes into. Name, browser type and extension are
 * never trusted. The bytes are not kept here: the caller keeps them once this answers a file.
 */
export async function attachedFileFromBrowserFile(
  file: File,
  schema: AttachedFileInputSchema,
  locale: Locale,
): Promise<ParsedWithMessages<AttachedFile>> {
  const refused = (message: string): ParsedWithMessages<AttachedFile> => ({
    success: false,
    messageByPath: { '': message },
  });
  if (file.size > attachedFileMaxSizeInBytes) return refused(ruleMessage('fileTooLarge', locale));
  const leadingBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const mediaType = mediaTypeFromLeadingBytes(leadingBytes);
  const kind = mediaType ? attachedFileKindByMediaType[mediaType] : null;
  const durationInSeconds = kind === 'video' ? await videoDurationInSeconds(file) : null;
  if (kind === 'video' && durationInSeconds === null)
    return refused(ruleMessage('unreadableFile', locale));
  const parsed = parseWithMessages(
    schema,
    {
      fileName:
        file.name.slice(0, textLengths.medium) || PORTFOLIO_COMMON_CONTENT[locale].fallbackFileName,
      mediaType: mediaType ?? '',
      sizeInBytes: file.size,
      ...(durationInSeconds === null ? {} : { durationInSeconds }),
    },
    locale,
  );
  if (!parsed.success) return parsed;
  if (kind === 'photo' && !(await isDrawableImage(file)))
    return refused(ruleMessage('unreadableFile', locale));
  return parsed;
}
