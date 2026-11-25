import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

const amountFormatters = {
  'pt-BR': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
  en: new Intl.NumberFormat('en', { style: 'currency', currency: 'BRL' }),
};

/** An amount in cents as Brazilian reais: "R$ 15.000,00", "R$15,000.00". */
export function formattedAmountInCents(amountInCents: number, locale: Locale): string {
  return amountFormatters[locale].format(amountInCents / 100);
}
