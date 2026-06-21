import { TriangleAlert } from "lucide-react";

/**
 * Compact, inline error banner for form-submission failures (e.g. invalid
 * credentials). `role="alert"` so it is announced when it appears. Copy must be
 * localized and user-friendly — never a raw technical error. For full-view
 * errors use `ErrorState` instead; this is scoped to a form.
 */
export function FormAlert({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-start"
    >
      <TriangleAlert
        className="mt-0.5 size-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
