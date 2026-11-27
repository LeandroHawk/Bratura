import { parseWithMessages, ruleMessage } from '@bratura/shared/messages/messages';
import {
  AttachedImageSchema,
  type AttachedFile,
  type AttachedFileSchema,
} from '@bratura/shared/primitives/domain/attached-file/fields';
import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const textAt = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/**
 * The type a file really is, read from its first bytes (its signature), or `null` when it is none
 * the portfolio keeps: a renamed `.exe` called `photo.jpg` is not taken for a photo.
 */
export function mediaTypeFromLeadingBytes(bytes: Uint8Array): string | null {
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
    return 'video/mp4';
  }
  if (textAt(bytes, 0, 3) === 'ID3' || (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0))
    return 'audio/mpeg';
  return null;
}

/** How long the video plays, read by the browser's own player; `null` when it cannot play it. */
function videoDurationInSeconds(file: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (seconds: number | null) => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      resolve(seconds);
    };
    video.preload = 'metadata';
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
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
  schema: typeof AttachedFileSchema | typeof AttachedImageSchema,
  locale: Locale,
): Promise<{ success: true; file: AttachedFile } | { success: false; message: string }> {
  const leadingBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const mediaType = mediaTypeFromLeadingBytes(leadingBytes);
  if (mediaType === null) {
    const refusal = schema === AttachedImageSchema ? 'notAnImage' : 'unsupportedFileType';
    return { success: false, message: ruleMessage(refusal, locale) };
  }
  const isVideo = mediaType.startsWith('video/');
  const durationInSeconds = isVideo ? await videoDurationInSeconds(file) : null;
  const parsed = parseWithMessages(
    schema,
    {
      fileName: file.name.slice(0, 200) || 'arquivo',
      mediaType,
      sizeInBytes: file.size,
      ...(durationInSeconds === null ? {} : { durationInSeconds }),
    },
    locale,
  );
  if (!parsed.success)
    return { success: false, message: Object.values(parsed.messageByPath)[0] ?? '' };
  if (mediaType.startsWith('image/') && !(await isDrawableImage(file)))
    return { success: false, message: ruleMessage('unreadableFile', locale) };
  return { success: true, file: parsed.value };
}
