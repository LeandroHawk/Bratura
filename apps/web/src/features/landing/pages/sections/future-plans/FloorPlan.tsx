import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { FUTURE_PLANS_CONTENT } from './content';

const ROOM_COUNT = 4;
/** Dashed, as on an architect's plan: what is planned but not built. */
const PLANNED_DASH = '4 3';

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
export function FloorPlan({ locale }: { locale: Locale }) {
  const { floorPlan, plans } = FUTURE_PLANS_CONTENT[locale];
  const inEveryRoom = plans.filter((plan) => !plan.isEntrance);
  const entrances = plans.filter((plan) => plan.isEntrance);
  return (
    <figure className="grid gap-12" aria-label={floorPlan.label}>
      <div aria-hidden="true">
        <div className="border-x-4 border-t-4 border-foreground">
          <div className="grid grid-cols-2 gap-[3px] bg-foreground pb-[3px] sm:grid-cols-4">
            {Array.from({ length: ROOM_COUNT }, (_, i) => (
              <span
                key={i}
                className="min-h-16 bg-background p-3 font-display text-small text-muted-foreground italic"
              >
                {floorPlan.room} {i + 1}
              </span>
            ))}
          </div>
          <div className="bg-background px-3 pt-3 pb-16">
            <p className="w-fit border-2 border-dashed border-foreground/60 px-3 py-1.5 text-small">
              {floorPlan.everyRoom}:{' '}
              <span className="font-semibold">
                {inEveryRoom.map((plan) => plan.title).join(' · ')}
              </span>
            </p>
          </div>
        </div>
        <div className="flex">
          <span className="h-1 flex-1 bg-foreground" />
          <Door name={floorPlan.website} planned={false} />
          <span className="h-1 flex-[2] bg-foreground" />
          {entrances.map((plan) => (
            <Door key={plan.title} name={plan.title} planned />
          ))}
          <span className="h-1 flex-1 bg-foreground" />
        </div>
      </div>
      <figcaption className="flex flex-wrap gap-x-6 gap-y-2 text-caption text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-1 w-6 bg-foreground" aria-hidden="true" />
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
