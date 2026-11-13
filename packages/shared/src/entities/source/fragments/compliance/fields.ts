import { z } from 'zod';

/**
 * Writes: the team, through `addSource`. Comes from: the team reading robots.txt and the terms, which
 * a source needs before it enters (rules 5.2 and 6.8: `docs/data-sources.md`, Rules).
 */
export const SourceComplianceFields = z.object({
  robotsCheckedOn: z.iso.date(),
  termsCheckedOn: z.iso.date(),
});
