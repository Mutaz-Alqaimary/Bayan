"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { reconcileStudentLinksAction } from "@/features/students/identity/actions";
import { useRouter } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";

type Counts = { linked: number; conflicts: number; unmatched: number };

/**
 * Admin-only one-time reconciliation backfill (Phase 12.5): links legacy
 * unlinked student-profiles to existing roster rows by email (an admin-vouched
 * match). Preview (dry run) first, then apply. Idempotent and safe to re-run.
 */
export function ReconcileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("students.identity.reconcile");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<Counts | null>(null);
  const [applied, setApplied] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPreview(null);
      setApplied(false);
    }
    onOpenChange(next);
  }

  async function run(dryRun: boolean) {
    setPending(true);
    const result = await reconcileStudentLinksAction(dryRun);
    setPending(false);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }
    setPreview({
      linked: result.linked,
      conflicts: result.conflicts,
      unmatched: result.unmatched,
    });
    if (!dryRun) {
      setApplied(true);
      toast({ title: t("appliedTitle") });
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div aria-live="polite" className="space-y-2">
        {preview ? (
          <>
            <dl className="grid grid-cols-3 gap-3 text-center">
              <Stat label={t("linked")} value={formatNumber(preview.linked, locale)} />
              <Stat
                label={t("conflicts")}
                value={formatNumber(preview.conflicts, locale)}
                warn={preview.conflicts > 0}
              />
              <Stat
                label={t("unmatched")}
                value={formatNumber(preview.unmatched, locale)}
              />
            </dl>
            {preview.linked === 0 && !applied ? (
              <p className="text-sm text-muted-foreground">{t("nothingToLink")}</p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("intro")}</p>
        )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => run(true)}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {t("preview")}
          </Button>
          <Button
            type="button"
            onClick={() => run(false)}
            disabled={pending || applied || !preview || preview.linked === 0}
          >
            {t("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={
        warn
          ? "rounded-lg border border-destructive/40 bg-destructive/10 p-3"
          : "rounded-lg border border-border/60 bg-card p-3"
      }
    >
      <p
        className={`text-xl font-bold tabular-nums ${warn ? "text-destructive-text" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
