import { describe, expect, test } from 'vitest';
import { CallNoticeDocumentUrlSchema } from './fields';

describe('CallNoticeDocumentUrlSchema', () => {
  test.each([
    'https://mapa.cultura.gov.br/files/opportunity/4321/edital.pdf',
    'https://mapa.cultura.gov.br/files/opportunity/4321/anexo-i.DOCX',
    'https://www.secult.mg.gov.br/download/category/15-fundo-estadual-de-cultura-fec?download=5059:fec-06-2026',
    'https://prefeituraitaperuna.com.br/sistema-inscricoes/public/edital_arquivo.php?id=94',
  ])('accepts a text file or a download handler: %s', (url) => {
    expect(CallNoticeDocumentUrlSchema.safeParse(url).success).toBe(true);
  });

  test.each([
    'https://mapa.cultura.gov.br/files/opportunity/4321/cartaz.jpg',
    'https://mapa.cultura.gov.br/files/opportunity/4321/planilha.xlsx',
    'https://prefeituraitaperuna.com.br/sistema-inscricoes/public/edital.php',
    'not a url',
  ])('refuses media, spreadsheets, a page script and broken links: %s', (url) => {
    expect(CallNoticeDocumentUrlSchema.safeParse(url).success).toBe(false);
  });
});
