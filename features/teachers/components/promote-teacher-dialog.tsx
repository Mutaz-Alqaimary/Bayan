"use client";

import { Check, Loader2, Search, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { normalizeForSearch } from "@/features/students/data/collation";
import { promoteToTeacherAction } from "@/features/teachers/actions";
import type { PromotableUserView } from "@/features/teachers/types";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Admin promotes an existing **authenticated user** (a `role='student'` profile)
 * to teacher. Roster-only students (no profile) are not promotable and never
 * appear here. Confirms via `promoteToTeacherAction`, which flips only
 * `profiles.role`.
 */
export function PromoteTeacherDialog({
  open,
  onOpenChange,
  candidates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: PromotableUserView[];
}) {
  const t = useTranslations("teachers.promote");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return candidates;
    return candidates.filter((user) =>
      normalizeForSearch(`${user.fullName} ${user.email ?? ""}`).includes(q),
    );
  }, [candidates, query]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setSelectedId(null);
    }
    onOpenChange(next);
  }

  async function onConfirm() {
    if (!selectedId) return;
    setPending(true);
    const result = await promoteToTeacherAction(selectedId);
    setPending(false);

    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }

    toast({ title: t("toastTitle") });
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            {t("noCandidates")}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Label htmlFor="promote-search" className="sr-only">
                {t("searchLabel")}
              </Label>
              <Search
                className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="promote-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="ps-9"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("noResults")}
              </p>
            ) : (
              <ul
                className="max-h-64 space-y-1 overflow-y-auto"
                aria-label={t("listLabel")}
              >
                {filtered.map((user) => {
                  const selected = user.id === selectedId;
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedId(user.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-start transition-colors",
                          selected
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {user.fullName || "—"}
                          </span>
                          <span
                            dir="ltr"
                            className="block truncate text-xs text-muted-foreground"
                          >
                            {user.email ?? "—"}
                          </span>
                        </span>
                        {selected ? (
                          <Check
                            className="size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending || !selectedId}
            aria-busy={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="size-4" aria-hidden="true" />
            )}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
