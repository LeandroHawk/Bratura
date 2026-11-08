import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Heading } from '@bratura/ui';
import { WHY_IT_MATTERS_CONTENT } from './content';

export function WhyItMatters({ locale }: { locale: Locale }) {
  const content = WHY_IT_MATTERS_CONTENT[locale];
  return (
    <Container
      as="section"
      aria-labelledby="por-que-title"
      className="grid gap-10 py-20 lg:grid-cols-[1fr_1fr]"
    >
      <Heading id="por-que-title" className="max-w-[20ch]">
        {content.title}
      </Heading>
      <div className="grid max-w-[60ch] gap-5 text-lg">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p className="border-t border-border pt-5 text-base text-muted-foreground">
          {content.sources}
        </p>
      </div>
    </Container>
  );
}
