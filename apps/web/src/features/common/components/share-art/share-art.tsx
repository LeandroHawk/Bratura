import {
  LIGHT_THEME_COLORS as C,
  LOGO_LETTER_COLORS,
  SPLAT_VIEWBOX,
  splatShapesFromSeed,
  LOGO_SPLAT_SEED,
  type SplatShape,
} from '@bratura/ui';

// Building blocks for images rendered with next/og (Open Graph card, app icon). next/og draws a
// subset of CSS with no variables or classes, so colors come from LIGHT_THEME_COLORS.

const TONE_COLOR: Record<SplatShape['tone'], string> = {
  front: C['logo-yellow'],
  'back-left': C['logo-blue'],
  'back-right': C['logo-green'],
};

export function SplatArt({ width }: { width: number }) {
  const height = (width * SPLAT_VIEWBOX.height) / SPLAT_VIEWBOX.width;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${SPLAT_VIEWBOX.width} ${SPLAT_VIEWBOX.height}`}
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      {splatShapesFromSeed(LOGO_SPLAT_SEED).map((s, i) =>
        s.kind === 'path' ? (
          <path key={i} d={s.d} fill={TONE_COLOR[s.tone]} />
        ) : (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={TONE_COLOR[s.tone]} />
        ),
      )}
    </svg>
  );
}

/** The word mark: tilted cut-out letters with a dark outline, over the splat. */
export function LogoArt({ fontSize }: { fontSize: number }) {
  const width = fontSize * 5.6;
  // next/og draws only one text-shadow, so the outline is a text stroke and the shadow the drop.
  const outline = Math.max(2, Math.round(fontSize * 0.07));
  const letterStyle = {
    WebkitTextStroke: `${outline}px ${C['logo-outline']}`,
    textShadow: `${outline}px ${outline * 1.4}px 0 ${C['logo-outline']}`,
  };
  return (
    <div style={{ display: 'flex', position: 'relative', width, height: width * 0.42 }}>
      <SplatArt width={width} />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: width * 0.13,
          top: width * 0.1,
          fontFamily: 'Titan One',
          fontSize,
        }}
      >
        {[...'Bratura'].map((letter, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              color: C[`logo-${LOGO_LETTER_COLORS[i]!}`],
              ...letterStyle,
              transform: i % 2 ? 'rotate(5deg) translateY(-4px)' : 'rotate(-6deg) translateY(3px)',
            }}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
}
