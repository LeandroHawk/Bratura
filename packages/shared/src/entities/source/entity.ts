import { z } from 'zod';
import { MapasCulturaisInstanceSourceSchema } from './kinds/mapas-culturais-instance/variant';
import { NewsSiteSourceSchema } from './kinds/news-site/variant';
import { OfficialPageSourceSchema } from './kinds/official-page/variant';

/**
 * Where call notices come from. Each kind is read differently and carries its own fields, so the
 * entity is one variant per kind (`kinds/`); every kind shares an identity and a compliance check
 * (`fragments/`). Registered by the team, never by ingestion: a source never enters by itself.
 */
export const SourceSchema = z.discriminatedUnion('kind', [
  MapasCulturaisInstanceSourceSchema,
  OfficialPageSourceSchema,
  NewsSiteSourceSchema,
]);

export type Source = z.infer<typeof SourceSchema>;

/** Which kind a source is: what decides how ingestion reads it. */
export const SourceKindSchema = z.union([
  MapasCulturaisInstanceSourceSchema.shape.kind,
  OfficialPageSourceSchema.shape.kind,
  NewsSiteSourceSchema.shape.kind,
]);

export type SourceKind = z.infer<typeof SourceKindSchema>;
