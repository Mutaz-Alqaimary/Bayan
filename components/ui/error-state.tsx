import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  /** Icon node (defaults to a warning triangle). */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional recovery action (e.g. a "Try again" Button). */
  action?: React.ReactNode;
  className?: string;
};

/**
 * Reusable error state with a recovery affordance. `role="alert"` so it is
 * announced by screen readers when it appears. Fully configurable — pass
 * localized, user-friendly copy (no raw technical errors).
 */
function ErrorState({
  icon = <TriangleAlert className="size-6" />,
  title,
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive [&_svg]:size-6"
      >
        {icon}
      </span>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export { ErrorState, type ErrorStateProps };
