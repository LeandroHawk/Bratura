import { z } from 'zod';
import { requiredString } from '../../code/string/fields';
import { validationMessage } from '../../code/validation-message/validation-message';

/** The ceiling of one attached file, whatever its kind: 25 MB (MiB, as the file manager counts). */
export const attachedFileMaxSizeInMegabytes = 25;
export const attachedFileMaxSizeInBytes = attachedFileMaxSizeInMegabytes * 1024 * 1024;

/** The longest video a portfolio keeps: one minute. */
export const attachedVideoMaxDurationInSeconds = 60;

/** The photos a portfolio shows: what every browser draws. */
export const attachedImageMediaTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Every type a portfolio keeps: photos, videos up to a minute, audios and scanned papers. */
export const attachedFileMediaTypes = [
  ...attachedImageMediaTypes,
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'application/pdf',
];

/**
 * A file a person attached (a photo, a video, an audio, a scanned paper). `mediaType` is read from
 * the file's first bytes, never trusted from its name or the browser; `storageKey` finds the bytes
 * where they are kept (absent on files an older demo kept by name only).
 */
const AttachedFileFields = z.object({
  fileName: requiredString('medium'),
  mediaType: z
    .string()
    .refine(
      (mediaType) => attachedFileMediaTypes.includes(mediaType),
      validationMessage('unsupportedFileType'),
    ),
  sizeInBytes: z
    .int()
    .nonnegative()
    .refine(
      (sizeInBytes) => sizeInBytes <= attachedFileMaxSizeInBytes,
      validationMessage('fileTooLarge'),
    ),
  storageKey: requiredString('short').optional(),
  /** Read from the video itself when it is attached; only videos carry it. */
  durationInSeconds: z
    .number()
    .nonnegative()
    .refine(
      (seconds) => seconds <= attachedVideoMaxDurationInSeconds,
      validationMessage('videoTooLong'),
    )
    .optional(),
});

const videoCarriesItsDuration = ({
  mediaType,
  durationInSeconds,
}: Pick<z.infer<typeof AttachedFileFields>, 'mediaType' | 'durationInSeconds'>) =>
  !mediaType.startsWith('video/') || durationInSeconds !== undefined;

export const AttachedFileSchema = AttachedFileFields.refine(videoCarriesItsDuration, {
  path: ['durationInSeconds'],
  ...validationMessage('unreadableFile'),
});

/** A photo or a logo: an attached file that is an image. */
export const AttachedImageSchema = AttachedFileFields.extend({
  mediaType: z
    .string()
    .refine(
      (mediaType) => attachedImageMediaTypes.includes(mediaType),
      validationMessage('notAnImage'),
    ),
});

export type AttachedFile = z.infer<typeof AttachedFileSchema>;
