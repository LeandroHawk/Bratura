import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { themeInitScript } from '@bratura/ui';
import { Fraunces, Instrument_Sans, Titan_One } from 'next/font/google';
import type { ReactNode } from 'react';
import '../../styles/globals.css';
import { InlineScript } from '../InlineScript';
import { RestoreSavedTheme } from '../RestoreSavedTheme';
import { LAYOUT_CONTENT } from './content';
import { MAIN_CONTENT_ID } from './mainContentId';

const logoFace = Titan_One({ weight: '400', subsets: ['latin'], variable: '--bt-face-logo' });
const displayFace = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--bt-face-display',
});
const bodyFace = Instrument_Sans({ subsets: ['latin'], variable: '--bt-face-body' });

/**
 * `<html>` and `<body>` of every page, for the `[lang]` layout and `global-not-found`: fonts, styles,
 * and the saved theme on both paths (`<head>` script for server HTML, `RestoreSavedTheme` for 404s).
 */
export function SiteDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html
      lang={locale}
      // The inline script may set data-theme before React hydrates.
      suppressHydrationWarning
      className={`${logoFace.variable} ${displayFace.variable} ${bodyFace.variable}`}
    >
      {/* App Router document head; the rule only knows files under app/ and the Pages Router. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body className="bg-background font-body text-foreground antialiased">
        <RestoreSavedTheme />
        {/* The alternative eMAG 2.2 asks for when scripts do not run. */}
        <noscript>
          <p className="border-b border-border bg-card px-4 py-2 text-center text-small">
            {LAYOUT_CONTENT[locale].withoutJavaScript}
          </p>
        </noscript>
        {/* First stop of the keyboard on every page, also on access key 1 (eMAG 1.5). */}
        <a
          href={`#${MAIN_CONTENT_ID}`}
          accessKey="1"
          className="focus-ring sr-only rounded-md border border-border bg-card px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          {LAYOUT_CONTENT[locale].skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
