import { cn } from "@/lib/utils";

/**
 * Minimal, dependency-free trend line drawn as an SVG polyline using a chart
 * token. Decorative (`aria-hidden`) — the underlying value is always presented
 * numerically next to it, so screen readers aren't left out. Rich, interactive
 * charts arrive in Phase 13.
 */
export function Sparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  if (data.length < 2) return null;

  const width = 100;
  const height = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
