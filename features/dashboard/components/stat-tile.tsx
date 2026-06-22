/**
 * A labeled statistic with an optional sub-line and an optional visual (e.g. a
 * sparkline or bars passed as children). Pure presentational; values arrive
 * pre-formatted.
 */
export function StatTile({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
