import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Heading } from '@bratura/ui';
import { WallLabel } from '../common/WallLabel';
import { FUTURE_PLANS_CONTENT } from './content';

/** Planned features, on the same two-column grid as the section above. */
export function FuturePlans({ locale }: { locale: Locale }) {
  const content = FUTURE_PLANS_CONTENT[locale];
  return (
    <Container
      as="section"
      aria-labelledby="future-plans-title"
      className="grid gap-10 pb-20 lg:grid-cols-[1fr_1fr]"
    >
      <div className="grid content-start gap-4">
        <Heading id="future-plans-title" className="max-w-[20ch]">
          {content.title}
        </Heading>
        <p className="max-w-[40ch] text-muted-foreground">{content.lead}</p>
      </div>
      <ul className="grid max-w-[60ch] gap-6">
        {content.plans.map((plan) => (
          <li key={plan.title} className="grid gap-1 border-t border-border pt-5">
            <WallLabel title={plan.title} medium={plan.medium}>
              <p className="text-lg">{plan.text}</p>
            </WallLabel>
          </li>
        ))}
      </ul>
    </Container>
  );
}
