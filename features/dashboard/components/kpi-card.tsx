import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

/**
 * A single key-performance card: label, large value, optional hint, and an icon
 * chip. Pure presentational — the role dashboard formats `value`/`hint`
 * (Western numerals) before passing them in.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
