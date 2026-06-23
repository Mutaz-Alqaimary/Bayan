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
import { deleteVocabularyTermAction } from "@/features/reading/actions";
import {
  vocabularyWord,
  type VocabularyTermRecord,
} from "@/features/reading/types";
import { useRouter } from "@/i18n/navigation";

/**
 * Confirm-and-delete dialog for a vocabulary term. Focus defaults to the safe
 * (cancel) action. Nothing references a term, so deletion is a straightforward
 * removal; failures surface as a localized toast.
 */
export function DeleteVocabularyDialog({
  open,
  onOpenChange,
  term,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: VocabularyTermRecord | null;
}) {
  const t = useTranslations("vocabulary");
  const locale = useLocale();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const word = term ? vocabularyWord(term, locale) : "";

  async function onConfirm() {
    if (!term) return;
    setIsDeleting(true);
    const result = await deleteVocabularyTermAction(term.id);
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
      description: t("toasts.deletedDescription", { word }),
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
            {t("delete.description", { word })}
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
