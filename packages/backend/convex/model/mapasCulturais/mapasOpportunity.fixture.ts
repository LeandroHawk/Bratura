/** A Mapas opportunity shaped like the federal instance's answer on 2026-11-13 (text invented). */
export const mapasOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: 4321,
  name: 'Edital de Difusão Cultural 2026',
  shortDescription: 'Apoio a projetos de difusão em todo o estado.',
  registrationFrom: { date: '2026-11-01 00:01:00.000000', timezone_type: 3, timezone: 'Etc/GMT+3' },
  registrationTo: { date: '2026-11-15 23:59:00.000000', timezone_type: 3, timezone: 'Etc/GMT+3' },
  singleUrl: 'https://mapa.cultura.gov.br/oportunidade/4321/',
  files: [],
  '@entityType': 'opportunity',
  '@files:downloads': [
    { url: 'https://mapa.cultura.gov.br/files/opportunity/4321/edital.pdf' },
    { url: 'https://mapa.cultura.gov.br/files/opportunity/4321/chamada.mp4' },
    { url: 'https://mapa.cultura.gov.br/files/opportunity/4321/anexo-i.DOCX' },
  ],
  ...overrides,
});
