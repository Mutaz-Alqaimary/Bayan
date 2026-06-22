import { cn } from "@/lib/utils";

/**
 * Circular progress indicator (e.g. weekly reading goal). Exposed to assistive
 * tech as a single labeled image (`role="img"` + localized `label`), so the
 * decorative SVG conveys its meaning without per-element narration. The centered
 * text uses Western numerals (JS number rendering), consistent with the app.
 */
export function ProgressRing({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const dashoffset = circumference * (1 - ratio);

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
        />
      </svg>
      <span
        dir="ltr"
        className="absolute text-sm font-semibold text-foreground"
      >
        {value}/{max}
      </span>
    </div>
  );
}
