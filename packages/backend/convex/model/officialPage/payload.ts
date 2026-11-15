import { z } from 'zod';

/**
 * One call as the reader found it on an official page: built by our code from HTML, parsed again
 * at the edge so a page that broke the reader's assumptions is counted, not stored.
 */
export const OfficialPageCallSchema = z.object({
  externalId: z.string(),
  title: z.string(),
  officialUrl: z.string(),
  documents: z.array(z.object({ url: z.string(), label: z.string() })),
});
export type OfficialPageCall = z.infer<typeof OfficialPageCallSchema>;
