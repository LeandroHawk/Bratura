import type { Locale } from '@bratura/shared/primitives/external/locale/enum';

/** A calendar day (`2026-03-14`) written for a reader: "14 de mar. de 2026", "Mar 14, 2026". */
export function formattedPlainDate(date: string, locale: Locale): string {
  // Read and written in UTC: a calendar day has no zone, so none may shift it.
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** An amount in cents as Brazilian reais: "R$ 15.000,00", "R$15,000.00". */
export function formattedAmountInCents(amountInCents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(
    amountInCents / 100,
  );
}

/** The calendar day an instant falls on in São Paulo, written for a reader. */
export function formattedDayOfInstant(instant: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(instant);
}
