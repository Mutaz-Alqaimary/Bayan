import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  /** Icon node (defaults to an inbox). Pass `<SomeIcon />` to override. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional call-to-action (e.g. a Button) shown below the description. */
  action?: React.ReactNode;
  className?: string;
};

/**
 * Reusable empty state for lists/tables/detail views. Fully configurable
 * (icon, title, description, action) — never hardcode copy here; pass localized
 * content from the calling feature.
 */
function EmptyState({
  icon = <Inbox className="size-6" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 p-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6"
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

export { EmptyState, type EmptyStateProps };
