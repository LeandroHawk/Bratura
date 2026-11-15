import { z } from 'zod';
import { requiredString } from '../../../../primitives/code/string/fields';

/** How many files and links one portfolio item keeps. */
export const portfolioItemListMax = 20;

/**
 * A file the creator attached (a photo, an audio, a scanned paper), as the browser describes it.
 * Where the bytes are stored joins this shape with the upload, in the backend.
 */
export const PortfolioAttachmentSchema = z.object({
  fileName: requiredString('medium'),
  /** The browser's MIME type; empty when it cannot tell. */
  mediaType: z.string().max(100),
  sizeInBytes: z.int().nonnegative(),
});

export type PortfolioAttachment = z.infer<typeof PortfolioAttachmentSchema>;
