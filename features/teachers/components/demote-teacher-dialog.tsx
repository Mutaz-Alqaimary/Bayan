"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { demoteToStudentAction } from "@/features/teachers/actions";
import type { TeacherView } from "@/features/teachers/types";
import { useRouter } from "@/i18n/navigation";

/**
 * Confirm-and-demote a teacher back to student. Focus defaults to the safe
 * (cancel) action. Demotion changes only `profiles.role`; the person's roster
 * row, reading history, and identity are preserved (the dialog says so).
 */
export function DemoteTeacherDialog({
  open,
  onOpenChange,
  teacher,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherView | null;
}) {
  const t = useTranslations("teachers.demote");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const name = teacher?.fullName || teacher?.email || "";

  async function onConfirm() {
    if (!teacher) return;
    setPending(true);
    const result = await demoteToStudentAction(teacher.id);
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
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { name })}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            autoFocus
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("demoting")}
              </>
            ) : (
              t("confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
