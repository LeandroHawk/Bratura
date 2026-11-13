import { z } from 'zod';
import { requiredHttpsUrl } from '../../../../primitives/code/url/fields';
import { requiredString } from '../../../../primitives/code/string/fields';
import { SourceComplianceFields } from '../../fragments/compliance/fields';
import { SourceIdentityFields } from '../../fragments/identity/fields';

/**
 * A government or agency site with no API (SP city culture calls, Amigos da Arte, Goiás): Firecrawl
 * lists its URLs with `/map`, keeps the call-like ones, and reads them with `/scrape`.
 */
export const OfficialPageSourceSchema = z.object({
  kind: z.literal('officialPage'),
  ...SourceIdentityFields.shape,
  ...SourceComplianceFields.shape,
  /** Where the site lists its calls; `/map` starts here. */
  listingUrl: requiredHttpsUrl,
  /** Parts of a URL that mark a call notice (`/edital`, `/chamamento`, `.pdf`); others are skipped. */
  callUrlPatterns: z.array(requiredString('short')).min(1).max(20),
});
