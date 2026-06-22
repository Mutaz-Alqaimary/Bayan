import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { AppRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type QuickAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: AppRoute;
  implemented: boolean;
};

/**
 * Grid of quick actions. Implemented destinations are locale-aware links;
 * not-yet-built ones render as a disabled item with a "coming soon" badge
 * instead of linking to a 404.
 */
export function QuickActions({
  actions,
  comingSoonLabel,
}: {
  actions: QuickAction[];
  comingSoonLabel: string;
}) {
  const base =
    "flex items-center gap-3 rounded-lg border border-border/60 p-3 text-start";

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {actions.map(({ key, label, icon: Icon, href, implemented }) => {
        const inner = (
          <>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-medium">{label}</span>
            {!implemented ? (
              <Badge variant="secondary" className="ms-auto shrink-0 text-[0.65rem]">
                {comingSoonLabel}
              </Badge>
            ) : null}
          </>
        );

        return (
          <li key={key}>
            {implemented ? (
              <Link
                href={href}
                className={cn(
                  base,
                  "transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                {inner}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={cn(base, "cursor-not-allowed text-muted-foreground")}
              >
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
