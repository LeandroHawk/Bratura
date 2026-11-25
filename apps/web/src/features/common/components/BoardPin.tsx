/** The pins' colours, the logo's, taken in turn along a board. */
const PIN_COLOURS = ['bg-logo-blue', 'bg-logo-yellow', 'bg-logo-green'] as const;

/**
 * A pushpin holding a sheet to a cork board, at its top centre; the `index`-th sheet gets the
 * `index`-th colour. Its parent is `relative`.
 */
export function BoardPin({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -top-2.5 left-1/2 z-10 size-5 -translate-x-1/2 rounded-full border-2 border-foreground shadow-cutout ${PIN_COLOURS[index % PIN_COLOURS.length]}`}
    />
  );
}
