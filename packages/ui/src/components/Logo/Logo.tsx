import { useId } from 'react';
import { LOGO_SPLAT_SEED, SPLAT_VIEWBOX, splatShapesFromSeed, type SplatTone } from './splat';

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
  /** Shows the slogan curved like a smile under the word. Leave it off at small sizes. */
  withSlogan?: boolean;
  /** Size comes from font-size, e.g. "text-6xl". */
  className?: string;
};

export function Logo({ withSlogan = true, className = '' }: LogoProps) {
  const arcId = useId();
  return (
    <div
      className={`bt-logo ${className}`}
      role="img"
      // The word mark and the slogan are Portuguese on every page, whatever the page language.
      lang="pt-BR"
      aria-label={withSlogan ? `Bratura, ${SLOGAN}` : 'Bratura'}
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
      {withSlogan && (
        <svg className="bt-logo-slogan" viewBox="0 0 300 64" aria-hidden="true">
          <path id={arcId} d="M 18 14 Q 150 74 282 14" fill="none" />
          <text textAnchor="middle">
            <textPath href={`#${arcId}`} startOffset="50%">
              {SLOGAN}
            </textPath>
          </text>
        </svg>
      )}
    </div>
  );
}
