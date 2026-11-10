import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { RoomLabel } from '../common/RoomLabel';
import { FUTURE_PLANS_CONTENT, type FuturePlanId } from './content';

/** Plans that are a door of their own; every other plan works in every room. */
const ENTRANCES: readonly FuturePlanId[] = ['whatsapp'];
/** Dashed, as on an architect's plan: what is planned but not built. */
const PLANNED_DASH = '4 3';
/** A stretch of the front wall; as thick as the building's `border-4`. */
const WALL = 'h-1 bg-foreground';

/** A door gap in the front wall, with its leaf swung open into the building. */
function Door({ name, planned }: { name: string; planned: boolean }) {
  return (
    <span className="relative w-12 shrink-0">
      <svg
        viewBox="0 0 48 48"
        className="absolute bottom-0 left-0 size-12 overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <g
          fill="none"
          className="stroke-foreground"
          strokeDasharray={planned ? PLANNED_DASH : undefined}
        >
          <line x1="0" y1="48" x2="0" y2="0" strokeWidth="3" />
          <path d="M0 0 A48 48 0 0 1 48 48" strokeWidth="1" />
        </g>
      </svg>
      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-small font-semibold whitespace-nowrap">
        {name}
      </span>
    </span>
  );
}

/** The product as one building: the same rooms for everyone, entered by the site or WhatsApp. */
export function FloorPlan({ locale, roomCount }: { locale: Locale; roomCount: number }) {
  const { floorPlan, plans } = FUTURE_PLANS_CONTENT[locale];
  const ids = Object.keys(plans) as FuturePlanId[];
  const inEveryRoom = ids.filter((id) => !ENTRANCES.includes(id)).map((id) => plans[id].title);
  const entrances = ENTRANCES.map((id) => plans[id].title);
  const list = new Intl.ListFormat(locale, { type: 'conjunction' });
  const label = floorPlan.label(
    list.format(inEveryRoom),
    list.format([floorPlan.website, ...entrances]),
  );
  return (
    <figure className="grid gap-12" aria-label={label}>
      <div aria-hidden="true">
        <div className="border-x-4 border-t-4 border-foreground">
          <div className="grid grid-cols-2 gap-[3px] bg-foreground pb-[3px] sm:grid-cols-4">
            {Array.from({ length: roomCount }, (_, i) => (
              <span key={i} className="min-h-16 bg-background p-3">
                <RoomLabel locale={locale} number={i + 1} />
              </span>
            ))}
          </div>
          <div className="bg-background px-3 pt-3 pb-16">
            <p className="w-fit border-2 border-dashed border-foreground px-3 py-1.5 text-small">
              {floorPlan.everyRoom}:{' '}
              <span className="font-semibold">{inEveryRoom.join(' · ')}</span>
            </p>
          </div>
        </div>
        <div className="flex">
          <span className={`${WALL} flex-1`} />
          <Door name={floorPlan.website} planned={false} />
          <span className={`${WALL} flex-[2]`} />
          {entrances.map((title) => (
            <Door key={title} name={title} planned />
          ))}
          <span className={`${WALL} flex-1`} />
        </div>
      </div>
      <figcaption className="flex flex-wrap gap-x-6 gap-y-2 text-caption text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className={`${WALL} w-6`} aria-hidden="true" />
          {floorPlan.essentials}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-6 border-t-2 border-dashed border-foreground" aria-hidden="true" />
          {floorPlan.afterEssentials}
        </span>
      </figcaption>
    </figure>
  );
}
