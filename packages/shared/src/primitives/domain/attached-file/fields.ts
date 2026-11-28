import { z } from 'zod';
import { requiredString } from '../../code/string/fields';
import { validationMessage } from '../../code/validation-message/validation-message';
import {
  AttachedFileMediaTypeEnum,
  attachedFileKindByMediaType,
  type AttachedFileMediaTypeOfKind,
} from './enum';

/** The ceiling of one attached file in MiB, as the file manager counts. */
export const attachedFileMaxSizeInMegabytes = 25;
export const attachedFileMaxSizeInBytes = attachedFileMaxSizeInMegabytes * 1024 * 1024;
export const attachedVideoMaxDurationInSeconds = 60;

const videoMediaTypes = AttachedFileMediaTypeEnum.options.filter(
  (mediaType): mediaType is AttachedFileMediaTypeOfKind<'video'> =>
    attachedFileKindByMediaType[mediaType] === 'video',
);

export const NonVideoAttachedFileSchema = z.object({
  fileName: requiredString('medium'),
  mediaType: AttachedFileMediaTypeEnum.exclude(videoMediaTypes),
  sizeInBytes: z
    .int()
    .nonnegative()
    .refine(
      (sizeInBytes) => sizeInBytes <= attachedFileMaxSizeInBytes,
      validationMessage('fileTooLarge'),
    ),
  /** This browser's IndexedDB key; becomes the Convex storage id when its table is written. */
  storageKey: z.uuid().optional(),
});

const VideoAttachedFileSchema = NonVideoAttachedFileSchema.extend({
  mediaType: AttachedFileMediaTypeEnum.extract(videoMediaTypes),
  durationInSeconds: z
    .number()
    .nonnegative()
    .refine(
      (seconds) => seconds <= attachedVideoMaxDurationInSeconds,
      validationMessage('videoTooLong'),
    ),
});

/** A video's media type requires its length; other files carry no duration. */
export const AttachedFileSchema = z
  .discriminatedUnion('mediaType', [NonVideoAttachedFileSchema, VideoAttachedFileSchema])
  .meta({ validationMessage: 'unsupportedFileType' });

export type AttachedFile = z.infer<typeof AttachedFileSchema>;
