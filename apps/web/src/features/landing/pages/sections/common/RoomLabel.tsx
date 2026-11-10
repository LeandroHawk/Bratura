import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Eyebrow } from '@bratura/ui';

const ROOM_WORD: Record<Locale, string> = { 'pt-BR': 'Sala', en: 'Room' };

/** A museum room's number ("Sala 2"), the same in the product flow and on the floor plan. */
export function RoomLabel({ locale, number }: { locale: Locale; number: number }) {
  return (
    <Eyebrow as="span">
      {ROOM_WORD[locale]} {number}
    </Eyebrow>
  );
}
