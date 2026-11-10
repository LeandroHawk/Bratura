/**
 * Each landing section's id: its in-page anchor and the base of its heading's id. One place, so a
 * link to a section (the hero's "how it works") cannot outlive a rename.
 */
export const SECTION_IDS = {
  hero: 'hero',
  howItWorks: 'como-funciona',
  whyItMatters: 'por-que',
  businessModel: 'modelo-de-negocio',
  futurePlans: 'proximas-salas',
} as const;
