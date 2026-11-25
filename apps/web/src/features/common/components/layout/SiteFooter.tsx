import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { Container, Logo } from '@bratura/ui';
import Link from 'next/link';
import { ExternalLink } from '@/features/common/components/ExternalLink';
import { ROUTES } from '@/features/common/config/routes';
import { BUILT_WITH, HACK_BRASIL, TEAM } from '@/features/common/config/site';
import { localizedPathFromLocale } from '@/features/common/utils/locale-path';
import { LAYOUT_CONTENT } from './content';

/**
 * Three columns from `md` up, stacked on a phone: the project (logo, competition, design system),
 * the team, and the tools behind it, each group under its label.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const content = LAYOUT_CONTENT[locale];
  const toolRows = [
    { label: content.builtWithSponsors, tools: BUILT_WITH.sponsors },
    { label: content.builtWithAgents, tools: BUILT_WITH.agents },
    { label: content.builtWithOthers, tools: BUILT_WITH.others },
  ];
  return (
    <footer className="border-t border-border print:hidden">
      <Container className="grid gap-8 py-10 text-sm text-muted-foreground md:grid-cols-[1fr_auto_auto] md:gap-x-12">
        <div className="grid content-start justify-items-start gap-3">
          <Logo slogan={false} className="text-3xl" />
          {/* The competition's site is in Portuguese only. */}
          <p>
            {content.madeFor}{' '}
            <ExternalLink
              href={HACK_BRASIL.url}
              hrefLang="pt-BR"
              locale={locale}
              className="text-foreground"
            >
              {content.event}
            </ExternalLink>
            <br />
            <ExternalLink
              href={HACK_BRASIL.tracksUrl}
              hrefLang="pt-BR"
              locale={locale}
              className="text-foreground"
            >
              {content.track}
            </ExternalLink>
          </p>
          <Link
            href={localizedPathFromLocale(locale, ROUTES.designSystem)}
            lang="en"
            className="text-link text-foreground"
          >
            {content.designSystem}
          </Link>
        </div>

        <div className="grid content-start gap-1">
          <p>{content.team}</p>
          <ul className="grid gap-1">
            {TEAM.map(({ name, linkedIn }) => (
              <li key={name}>
                <ExternalLink href={linkedIn} locale={locale} className="text-foreground">
                  {name}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid content-start gap-3">
          {toolRows.map(({ label, tools }) => (
            <div key={label} className="grid gap-1">
              <dt>{label}</dt>
              <dd>
                {tools.map((tool, i) => (
                  <span key={tool.name}>
                    {i > 0 && ' · '}
                    <ExternalLink href={tool.url} locale={locale} className="text-foreground">
                      {tool.name}
                    </ExternalLink>
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </footer>
  );
}
