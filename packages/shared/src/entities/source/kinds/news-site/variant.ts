import { z } from 'zod';
import { requiredHttpsUrl } from '../../../../primitives/code/url/fields';
import { SourceComplianceFields } from '../../fragments/compliance/fields';
import { SourceIdentityFields } from '../../fragments/identity/fields';

/**
 * A news site: only a signal that a call opened. Its text is never stored and never becomes a call
 * notice; the call is read from its official source (`docs/data-sources.md`, Rules).
 */
export const NewsSiteSourceSchema = z.object({
  kind: z.literal('newsSite'),
  ...SourceIdentityFields.shape,
  ...SourceComplianceFields.shape,
  siteUrl: requiredHttpsUrl,
});
