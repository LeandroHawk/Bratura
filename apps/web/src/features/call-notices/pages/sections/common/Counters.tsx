/** A row of counted things: the number large, what it counts under it. */
export function Counters({ counters }: { counters: { label: string; count: number }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {counters.map(({ label, count }, index) => (
        <div
          key={label}
          className="rise-in flex flex-col-reverse rounded-2xl border border-border bg-card p-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <dt className="text-small text-muted-foreground">{label}</dt>
          <dd className="font-display text-4xl leading-none font-bold">{count}</dd>
        </div>
      ))}
    </dl>
  );
}
