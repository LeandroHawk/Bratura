import type { Locale } from '@bratura/shared/primitives/external/locale/enum';
import { LIGHT_THEME_COLORS as C } from '@bratura/ui';
import { SITE_SLOGAN, TAGLINE } from '@/features/common/config/site';
import { ImageResponse } from 'next/og';
import { loadGoogleFont } from '@/features/common/utils/load-google-font';
import { SHARE_CARD_CONTENT } from './content';
import { LogoArt } from './share-art';

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

/** Read by screen readers and crawlers in place of the card. */
export function shareCardAltFromLocale(locale: Locale): string {
  return `Bratura, ${SITE_SLOGAN[locale]}. ${TAGLINE[locale]}`;
}

/** The link preview card of one locale (WhatsApp, social networks, the hackathon panel). */
export async function shareCardImageFromLocale(locale: Locale): Promise<ImageResponse> {
  const headline = TAGLINE[locale];
  const slogan = SITE_SLOGAN[locale];
  const { footnote } = SHARE_CARD_CONTENT[locale];
  const [logo, display, displayItalic, body] = await Promise.all([
    loadGoogleFont('Titan+One', 'Bratura'),
    loadGoogleFont('Fraunces:wght@700', headline),
    loadGoogleFont('Fraunces:ital,wght@1,500', slogan),
    loadGoogleFont('Instrument+Sans:wght@600', footnote),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '64px 80px',
        background: C.background,
        color: C.foreground,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <LogoArt fontSize={96} />
        <div style={{ fontFamily: 'Fraunces Italic', fontSize: 36, marginLeft: 70 }}>{slogan}</div>
      </div>
      <div style={{ fontFamily: 'Fraunces', fontSize: 58, lineHeight: 1.1, maxWidth: 900 }}>
        {headline}
      </div>
      <div style={{ fontFamily: 'Instrument Sans', fontSize: 26, color: C['muted-foreground'] }}>
        {footnote}
      </div>
    </div>,
    {
      ...SHARE_CARD_SIZE,
      fonts: [
        { name: 'Titan One', data: logo, weight: 400 },
        { name: 'Fraunces', data: display, weight: 700 },
        { name: 'Fraunces Italic', data: displayItalic, weight: 500, style: 'italic' },
        { name: 'Instrument Sans', data: body, weight: 600 },
      ],
    },
  );
}
