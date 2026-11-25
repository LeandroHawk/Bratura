import type { Locale } from '../../external/locale/enum';

const dateFormatters = {
  'pt-BR': new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' }),
  en: new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }),
};
const instantFormatters = {
  'pt-BR': new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' }),
  en: new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' }),
};

/** A calendar day (`2026-03-14`) written for a reader: "14 de mar. de 2026", "Mar 14, 2026". */
export function formattedPlainDate(date: string, locale: Locale): string {
  // Read and written in UTC: a calendar day has no zone, so none may shift it.
  return dateFormatters[locale].format(new Date(`${date}T00:00:00Z`));
}

/** The calendar day an instant falls on in São Paulo, written for a reader. */
export function formattedDayOfInstant(instant: number, locale: Locale): string {
  return instantFormatters[locale].format(instant);
}
