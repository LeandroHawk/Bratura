import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { CREATOR_LABELS } from '@/features/common/content/creator-labels';

/** A value the source does not give: "não informado", quiet even inside a bold value. */
export function NotInformed({ locale }: { locale: Locale }) {
  return (
    <span className="font-normal text-muted-foreground">{CREATOR_LABELS[locale].notInformed}</span>
  );
}
