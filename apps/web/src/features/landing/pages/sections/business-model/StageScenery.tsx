const PROP = 'h-20 w-auto sm:h-28 xl:h-36';

function Vase() {
  return (
    <svg viewBox="0 0 60 120" className={PROP} aria-hidden="true" focusable="false">
      <rect x="6" y="76" width="48" height="6" rx="1" className="fill-wood-edge" />
      <rect x="10" y="82" width="40" height="38" className="fill-wood-grain" />
      <rect x="21" y="28" width="18" height="4" rx="1" className="fill-wood-edge" />
      <path
        d="M23 32 C23 38 27 40 27 42 C14 48 10 60 16 70 C19 75 24 76 26 76 H34 C36 76 41 75 44 70 C50 60 46 48 33 42 C33 40 37 38 37 32 Z"
        className="fill-wood"
      />
      <path d="M14 55 Q30 61 46 55" fill="none" strokeWidth="2.4" className="stroke-cord" />
      <path
        d="M15 63 Q30 69 45 63"
        fill="none"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        className="stroke-wood-ink"
      />
      <ellipse cx="20" cy="52" rx="1.8" ry="5" opacity="0.3" className="fill-wood-ink" />
    </svg>
  );
}

function Easel() {
  return (
    <svg viewBox="0 0 80 140" className={PROP} aria-hidden="true" focusable="false">
      <g strokeWidth="4" strokeLinecap="round" className="stroke-wood-grain">
        <line x1="40" y1="8" x2="40" y2="138" strokeWidth="2.5" />
        <line x1="40" y1="8" x2="14" y2="138" />
        <line x1="40" y1="8" x2="66" y2="138" />
      </g>
      <rect x="8" y="26" width="64" height="66" className="fill-cord-shade" />
      <rect x="10" y="28" width="60" height="62" className="fill-cord" />
      <rect x="14" y="32" width="52" height="54" className="fill-art-blue" />
      <circle cx="53" cy="45" r="6.5" className="fill-art-yellow" />
      <path d="M14 86 V70 Q27 58 40 67 Q53 77 66 63 V86 Z" className="fill-art-green" />
      <path d="M14 86 V79 Q36 71 66 81 V86 Z" className="fill-wood" />
      <rect x="6" y="92" width="68" height="5" rx="1" className="fill-wood-edge" />
    </svg>
  );
}

function Viola() {
  return (
    <svg viewBox="-10 0 60 140" className={PROP} aria-hidden="true" focusable="false">
      <g transform="rotate(-8 25 136)">
        <rect x="22" y="14" width="6" height="74" className="fill-wood-grain" />
        <path d="M19 2 H31 L32 16 H18 Z" className="fill-wood-edge" />
        {[5, 9, 13].map((y) => (
          <g key={y} className="fill-cord">
            <circle cx="16.5" cy={y} r="1.6" />
            <circle cx="33.5" cy={y} r="1.6" />
          </g>
        ))}
        <path
          d="M25 82 C12 82 10 92 14 100 C16 104 15 106 12 110 C6 120 10 136 25 136 C40 136 44 120 38 110 C35 106 34 104 36 100 C40 92 38 82 25 82 Z"
          className="fill-wood"
        />
        <circle cx="25" cy="106" r="6.5" fill="none" strokeWidth="1" className="stroke-cord" />
        <circle cx="25" cy="106" r="4.5" className="fill-wood-edge" />
        <rect x="18" y="122" width="14" height="3" rx="1" className="fill-wood-edge" />
        <g strokeWidth="0.5" className="stroke-cord-highlight">
          {[23.5, 25, 26.5].map((x) => (
            <line key={x} x1={x} y1="16" x2={x} y2="123" />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** Patches laid so no two neighbours share a colour. */
const PATCHES = [
  ['fill-art-green', 'fill-art-yellow', 'fill-art-blue'],
  ['fill-art-red', 'fill-art-blue', 'fill-art-green'],
  ['fill-art-yellow', 'fill-art-green', 'fill-art-red'],
];

function Quilt() {
  return (
    <svg viewBox="0 0 80 120" className={PROP} aria-hidden="true" focusable="false">
      <rect x="4" y="8" width="4" height="110" className="fill-wood-grain" />
      <rect x="72" y="8" width="4" height="110" className="fill-wood-grain" />
      <rect x="0" y="116" width="12" height="4" rx="1" className="fill-wood-edge" />
      <rect x="68" y="116" width="12" height="4" rx="1" className="fill-wood-edge" />
      {PATCHES.flatMap((row, r) =>
        row.map((paint, c) => (
          <g key={`${r}-${c}`}>
            <rect x={10 + c * 20} y={14 + r * 24} width="20" height="24" className={paint} />
            <rect
              x={12 + c * 20}
              y={16 + r * 24}
              width="16"
              height="20"
              fill="none"
              strokeWidth="0.8"
              strokeDasharray="2 1.6"
              className="stroke-wood-ink"
            />
          </g>
        )),
      )}
      <g strokeWidth="1" className="stroke-cord">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={11 + i * 4.8} y1="86" x2={11 + i * 4.8} y2="91" />
        ))}
      </g>
      <rect x="2" y="10" width="76" height="4" rx="2" className="fill-wood-edge" />
    </svg>
  );
}

/**
 * One object per art on the stage floor (vase, painting, viola, quilt), so the stage reads as every
 * creator's, not only performers'. Flanks the text on wide screens (`xl:contents` hands the two
 * groups to the stage grid), one row under it on narrower ones. Decoration only.
 */
export function StageScenery() {
  return (
    <div className="flex items-end justify-around xl:contents" aria-hidden="true">
      <div className="flex items-end justify-center gap-3 xl:col-start-1 xl:row-start-1">
        <Vase />
        <Easel />
      </div>
      <div className="flex items-end justify-center gap-3 xl:col-start-3 xl:row-start-1">
        <Viola />
        <Quilt />
      </div>
    </div>
  );
}
