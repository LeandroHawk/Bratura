import { z } from 'zod';

/**
 * A SHA-256 digest in lowercase hex (64 characters): what names a content, so work keyed by it
 * (reading, extracting) is done once per content and again only when the content changes.
 */
export const requiredSha256Hex = z.string().regex(/^[0-9a-f]{64}$/);
