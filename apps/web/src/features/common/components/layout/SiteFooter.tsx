import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Logo } from '@bratura/ui';
import { NewTabHint } from '@/features/common/components/NewTabHint';
import { BUILT_WITH, TEAM } from '@/features/common/config/site';
import { LAYOUT_CONTENT } from './content';

export function SiteFooter({ locale }: { locale: Locale }) {
  const content = LAYOUT_CONTENT[locale];
  const toolRows = [
    { label: content.builtWithSponsors, tools: BUILT_WITH.sponsors },
    { label: content.builtWithOthers, tools: BUILT_WITH.others },
  ];
  return (
    <footer className="border-t border-border print:hidden">
      <Container className="flex flex-wrap items-center justify-between gap-6 py-10 text-sm text-muted-foreground">
        <Logo slogan={false} className="text-3xl" />
        <div className="grid gap-4">
          <p>
            {content.madeFor}
            <br />
            {TEAM.join(' · ')}
          </p>
          <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            {toolRows.map(({ label, tools }) => (
              <div key={label} className="contents">
                <dt>{label}</dt>
                <dd className="mb-2 sm:mb-0">
                  {tools.map((tool, i) => (
                    <span key={tool.name}>
                      {i > 0 && ' · '}
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-sm font-semibold text-foreground underline-offset-4 focus-ring hover:underline"
                      >
                        {tool.name}
                        <NewTabHint locale={locale} />
                      </a>
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </footer>
  );
}
