"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

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
import {
  createPassageAction,
  updatePassageAction,
} from "@/features/reading/actions";
import { PassageFormFields } from "@/features/reading/components/passage-form-fields";
import { useReadingSchemaMessages } from "@/features/reading/components/use-reading-schema-messages";
import { buildCreatePassageSchema } from "@/features/reading/schemas";
import type {
  CreatePassageFormValues,
  ReadingPassageRecord,
} from "@/features/reading/types";
import { useRouter } from "@/i18n/navigation";

const EMPTY_VALUES: CreatePassageFormValues = {
  title_ar: "",
  title_en: "",
  content_ar: "",
  content_en: "",
  difficulty_level: "",
  estimated_minutes: "",
};

function toFormValues(passage: ReadingPassageRecord): CreatePassageFormValues {
  return {
    title_ar: passage.title_ar,
    title_en: passage.title_en ?? "",
    content_ar: passage.content_ar,
    content_en: passage.content_en ?? "",
    difficulty_level: String(passage.difficulty_level),
    estimated_minutes: String(passage.estimated_minutes),
  };
}

/**
 * Create/edit passage dialog. When `passage` is null it creates; otherwise it
 * edits that record. On success it shows a localized toast, closes, and
 * refreshes the server-rendered list.
 */
export function PassageFormDialog({
  open,
  onOpenChange,
  passage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passage: ReadingPassageRecord | null;
}) {
  const t = useTranslations("passages");
  const messages = useReadingSchemaMessages();
  const router = useRouter();
  const isEdit = passage !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePassageFormValues>({
    resolver: zodResolver(buildCreatePassageSchema(messages)),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(passage ? toFormValues(passage) : EMPTY_VALUES);
    }
  }, [open, passage, reset]);

  async function onSubmit(values: CreatePassageFormValues) {
    const result = isEdit
      ? await updatePassageAction(passage.id, values)
      : await createPassageAction(values);

    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }

    toast({
      title: isEdit ? t("toasts.updatedTitle") : t("toasts.createdTitle"),
      description: isEdit
        ? t("toasts.updatedDescription")
        : t("toasts.createdDescription"),
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("form.editDescription") : t("form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <PassageFormFields
            register={register}
            errors={errors}
            disabled={isSubmitting}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("form.saving")}
                </>
              ) : isEdit ? (
                t("form.saveEdit")
              ) : (
                t("form.saveCreate")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
