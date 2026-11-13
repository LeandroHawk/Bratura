import { z } from 'zod';
import { requiredHttpsUrl } from '../../../../primitives/code/url/fields';
import { SourceComplianceFields } from '../../fragments/compliance/fields';
import { SourceIdentityFields } from '../../fragments/identity/fields';

/**
 * A Mapas Culturais instance (federal, a state, a city): read through its public JSON API, no
 * Firecrawl credits. It lists call notices with dates and the link to each one's PDF.
 */
export const MapasCulturaisInstanceSourceSchema = z.object({
  kind: z.literal('mapasCulturaisInstance'),
  ...SourceIdentityFields.shape,
  ...SourceComplianceFields.shape,
  /** The instance's root (`https://mapa.cultura.gov.br`); the API lives under `/api/`. */
  baseUrl: requiredHttpsUrl,
});
