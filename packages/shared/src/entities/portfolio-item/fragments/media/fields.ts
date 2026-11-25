import { z } from 'zod';
import { requiredHttpUrl } from '../../../../primitives/code/url/fields';
import { AttachedFileSchema } from '../../../../primitives/domain/attached-file/fields';

/** How many files and links one portfolio item keeps. */
export const portfolioItemMediaMax = 20;

/**
 * What shows the work of an experience or a project: links to videos and pages, and the files
 * attached (photos, audios, proofs such as a certificate or a press clipping).
 */
export const PortfolioItemMediaFields = z.object({
  links: z.array(requiredHttpUrl).max(portfolioItemMediaMax),
  attachments: z.array(AttachedFileSchema).max(portfolioItemMediaMax),
});
