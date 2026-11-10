import { useId } from 'react';
import { LOGO_SPLAT_SEED, SPLAT_VIEWBOX, splatShapesFromSeed, type SplatTone } from './splat';

/** The original slogan, in Portuguese: the default, and what a page in another language translates. */
export const SLOGAN = 'o seu país com mais cultura';

const LETTERS = [...'Bratura'];
/** Brazilian flag colors, cycling green, yellow, blue. */
export const LOGO_LETTER_COLORS = [
  'green',
  'yellow',
  'blue',
  'green',
  'yellow',
  'blue',
  'green',
] as const;

const TONE_FILL: Record<SplatTone, string> = {
  front: 'fill-logo-yellow',
  'back-left': 'fill-logo-blue',
  'back-right': 'fill-logo-green',
};

const SPLAT = splatShapesFromSeed(LOGO_SPLAT_SEED);

export type LogoProps = {
  /**
   * The slogan curved like a smile under the word: its words and their language, so a page can
   * pass a translation. `false` leaves it off, for small sizes.
   */
  slogan?: { text: string; lang: string } | false;
  /** Size comes from font-size, e.g. "text-6xl". */
  className?: string;
};

export function Logo({ slogan = { text: SLOGAN, lang: 'pt-BR' }, className = '' }: LogoProps) {
  const arcId = useId();
  return (
    <div
      className={`bt-logo ${className}`}
      role="img"
      // The name is the same in every language; the slogan, when shown, sets how it is read aloud.
      lang={slogan ? slogan.lang : 'pt-BR'}
      aria-label={slogan ? `Bratura, ${slogan.text}` : 'Bratura'}
    >
      <div className="bt-logo-mark" aria-hidden="true">
        <svg
          className="bt-logo-splat"
          viewBox={`0 0 ${SPLAT_VIEWBOX.width} ${SPLAT_VIEWBOX.height}`}
          preserveAspectRatio="none"
        >
          {SPLAT.map((shape, i) =>
            shape.kind === 'path' ? (
              <path key={i} d={shape.d} className={TONE_FILL[shape.tone]} />
            ) : (
              <circle
                key={i}
                cx={shape.cx}
                cy={shape.cy}
                r={shape.r}
                className={TONE_FILL[shape.tone]}
              />
            ),
          )}
        </svg>
        <span className="bt-logo-word">
          {LETTERS.map((letter, i) => (
            <span key={i} style={{ color: `var(--bt-logo-${LOGO_LETTER_COLORS[i]})` }}>
              {letter}
            </span>
          ))}
        </span>
      </div>
      {slogan && (
        <svg className="bt-logo-slogan" viewBox="0 0 300 64" aria-hidden="true">
          {/* The smile's parabola (lowest at y 44), drawn wider than the box: text past the end of a
              path is not drawn, and a translated slogan can be longer than the Portuguese one. */}
          <path id={arcId} d="M -10 0 Q 150 88 310 0" fill="none" />
          <text textAnchor="middle">
            <textPath href={`#${arcId}`} startOffset="50%">
              {slogan.text}
            </textPath>
          </text>
        </svg>
      )}
    </div>
  );
}
