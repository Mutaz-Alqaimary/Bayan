import { cn } from "@/lib/utils";

/**
 * Compact vertical bar chart (e.g. sessions per day) using a chart token.
 * Decorative (`aria-hidden`); the meaningful totals are shown numerically
 * alongside. Mirrors naturally in RTL since bars are laid out with flex.
 */
export function MiniBars({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  const max = Math.max(...data, 1);

  return (
    <div
      className={cn("flex h-12 items-end gap-1", className)}
      aria-hidden="true"
    >
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-sm opacity-80"
          style={{
            height: `${Math.max((value / max) * 100, 4)}%`,
            backgroundColor: "var(--chart-1)",
          }}
        />
      ))}
    </div>
  );
}
