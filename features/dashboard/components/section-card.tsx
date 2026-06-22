import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A titled dashboard section in a card. The title is a real `<h2>` so each
 * dashboard has a coherent heading outline under its single `<h1>`.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="space-y-0.5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </Card>
  );
}
