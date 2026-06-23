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
import { deletePassageAction } from "@/features/reading/actions";
import { passageTitle, type ReadingPassageRecord } from "@/features/reading/types";
import { useRouter } from "@/i18n/navigation";

/**
 * Confirm-and-delete dialog for a passage. Focus defaults to the safe (cancel)
 * action. The DB is the source of truth for removability: if reading sessions or
 * vocabulary still reference the passage, the action refuses (FK violation) and
 * the localized "in use" failure surfaces as a toast.
 */
export function DeletePassageDialog({
  open,
  onOpenChange,
  passage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passage: ReadingPassageRecord | null;
}) {
  const t = useTranslations("passages");
  const locale = useLocale();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const title = passage ? passageTitle(passage, locale) : "";

  async function onConfirm() {
    if (!passage) return;
    setIsDeleting(true);
    const result = await deletePassageAction(passage.id);
    setIsDeleting(false);

    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }

    toast({
      title: t("toasts.deletedTitle"),
      description: t("toasts.deletedDescription", { title }),
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("delete.title")}</DialogTitle>
          <DialogDescription>
            {t("delete.description", { title })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            autoFocus
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t("delete.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            aria-busy={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("delete.deleting")}
              </>
            ) : (
              t("delete.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
