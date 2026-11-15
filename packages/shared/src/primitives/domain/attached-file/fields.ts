import { z } from 'zod';
import { requiredString } from '../../code/string/fields';

/**
 * A file a person attached (a photo, an audio, a scanned paper), as the browser describes it.
 * Where the bytes are stored joins this shape with the upload, in the backend.
 */
export const AttachedFileSchema = z.object({
  fileName: requiredString('medium'),
  /** The browser's MIME type; empty when it cannot tell. */
  mediaType: z.string().max(100),
  sizeInBytes: z.int().nonnegative(),
});

export type AttachedFile = z.infer<typeof AttachedFileSchema>;
