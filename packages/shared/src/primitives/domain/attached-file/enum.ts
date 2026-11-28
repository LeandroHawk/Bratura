import { z } from 'zod';

export const AttachedFileMediaTypeEnum = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'application/pdf',
]);
export type AttachedFileMediaType = z.infer<typeof AttachedFileMediaTypeEnum>;

export const attachedFileKindByMediaType = {
  'image/jpeg': 'photo',
  'image/png': 'photo',
  'image/webp': 'photo',
  'image/gif': 'photo',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'application/pdf': 'document',
} as const satisfies Record<AttachedFileMediaType, string>;

const formatNameByMediaType: Record<AttachedFileMediaType, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'video/mp4': 'MP4',
  'video/webm': 'WebM',
  'video/quicktime': 'MOV',
  'audio/mpeg': 'MP3',
  'audio/mp4': 'M4A',
  'audio/ogg': 'OGG',
  'audio/wav': 'WAV',
  'application/pdf': 'PDF',
};

export function attachedFileFormatNames(mediaTypes: readonly AttachedFileMediaType[]): string {
  return mediaTypes.map((mediaType) => formatNameByMediaType[mediaType]).join(', ');
}

export const attachedFileFormatsByKind = Object.fromEntries(
  ['photo', 'video', 'audio', 'document'].map((kind) => [
    kind,
    attachedFileFormatNames(
      AttachedFileMediaTypeEnum.options.filter(
        (mediaType) => attachedFileKindByMediaType[mediaType] === kind,
      ),
    ),
  ]),
);

export type AttachedFileMediaTypeOfKind<
  Kind extends (typeof attachedFileKindByMediaType)[AttachedFileMediaType],
> = {
  [MediaType in AttachedFileMediaType]: (typeof attachedFileKindByMediaType)[MediaType] extends Kind
    ? MediaType
    : never;
}[AttachedFileMediaType];
