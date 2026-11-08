import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Eyebrow, Heading } from '@bratura/ui';
import { WallLabel } from '../common/WallLabel';
import { HOW_IT_WORKS_CONTENT } from './content';

export function HowItWorks({ locale }: { locale: Locale }) {
  const content = HOW_IT_WORKS_CONTENT[locale];
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="border-y border-border bg-card"
    >
      <Container className="grid gap-10 py-16">
        <Heading id="como-funciona-title" className="max-w-[24ch]">
          {content.title}
        </Heading>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.rooms.map((room, i) => (
            <li
              key={room.title}
              className="grid content-start gap-2 border-l-2 border-primary bg-background py-4 pr-4 pl-5"
            >
              <Eyebrow as="span">
                {content.room} {i + 1}
              </Eyebrow>
              <WallLabel title={room.title} medium={room.medium}>
                <p className="text-small">{room.text}</p>
              </WallLabel>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
