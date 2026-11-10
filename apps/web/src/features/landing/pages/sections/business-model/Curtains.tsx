/**
 * The stage's drapery: a scalloped valance on top and two curtains tied back at the sides, in the
 * design system's velvet (`--bt-curtain`), with the light cord's brass for tiebacks and fringe.
 * Pure decoration.
 */
function Curtain({ side }: { side: 'left' | 'right' }) {
  const id = `bm-curtain-${side}`;
  return (
    <svg
      viewBox="0 0 100 400"
      preserveAspectRatio="none"
      className={`absolute inset-y-0 h-full w-[13%] max-w-28 ${side === 'left' ? 'left-0' : 'right-0 -scale-x-100'}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((offset, i) => (
            <stop
              key={offset}
              offset={offset}
              style={{ stopColor: i % 2 ? 'var(--bt-curtain-fold)' : 'var(--bt-curtain)' }}
            />
          ))}
        </linearGradient>
      </defs>
      <path d="M0 0 H100 C92 110 50 200 34 246 C46 300 74 360 86 400 H0 Z" fill={`url(#${id})`} />
      <rect x="0" y="240" width="40" height="10" rx="5" className="fill-cord" />
    </svg>
  );
}

function Valance() {
  const scallops = 12;
  const step = 100 / scallops;
  const edge = Array.from(
    { length: scallops },
    (_, i) => `Q${(i + 0.5) * step} 10 ${(i + 1) * step} 5`,
  ).join(' ');
  return (
    <svg
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-0 z-30 h-7 w-full"
      aria-hidden="true"
      focusable="false"
    >
      <path d={`M0 0 V5 ${edge} V0 Z`} className="fill-curtain-fold" />
      <path d={`M0 5 ${edge}`} fill="none" className="stroke-cord" strokeWidth="0.6" />
    </svg>
  );
}

/** The tied-back curtains and the valance: what stays once the stage is open. */
export function Drapes() {
  return (
    <>
      <Valance />
      <Curtain side="left" />
      <Curtain side="right" />
    </>
  );
}

/** Velvet folds for the closed panels: vertical stripes of the two curtain tones. */
export const FOLDS_BACKGROUND =
  'repeating-linear-gradient(90deg, var(--bt-curtain) 0 18px, var(--bt-curtain-fold) 36px, var(--bt-curtain) 54px)';
