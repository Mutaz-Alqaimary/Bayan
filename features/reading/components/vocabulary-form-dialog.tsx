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
  createVocabularyTermAction,
  updateVocabularyTermAction,
} from "@/features/reading/actions";
import { useReadingSchemaMessages } from "@/features/reading/components/use-reading-schema-messages";
import { VocabularyFormFields } from "@/features/reading/components/vocabulary-form-fields";
import { buildCreateVocabularyTermSchema } from "@/features/reading/schemas";
import type {
  CreateVocabularyTermFormValues,
  PassageOption,
  VocabularyTermRecord,
} from "@/features/reading/types";
import { useRouter } from "@/i18n/navigation";

const EMPTY_VALUES: CreateVocabularyTermFormValues = {
  passage_id: "",
  word_ar: "",
  word_en: "",
  meaning_ar: "",
  meaning_en: "",
};

function toFormValues(
  term: VocabularyTermRecord,
): CreateVocabularyTermFormValues {
  return {
    passage_id: term.passage_id,
    word_ar: term.word_ar,
    word_en: term.word_en ?? "",
    meaning_ar: term.meaning_ar,
    meaning_en: term.meaning_en ?? "",
  };
}

/**
 * Create/edit vocabulary term dialog. When `term` is null it creates; otherwise
 * it edits that record. The passage selector is required (terms are scoped to a
 * passage). On success it shows a localized toast, closes, and refreshes.
 */
export function VocabularyFormDialog({
  open,
  onOpenChange,
  term,
  passages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: VocabularyTermRecord | null;
  passages: PassageOption[];
}) {
  const t = useTranslations("vocabulary");
  const messages = useReadingSchemaMessages();
  const router = useRouter();
  const isEdit = term !== null;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateVocabularyTermFormValues>({
    resolver: zodResolver(buildCreateVocabularyTermSchema(messages)),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(term ? toFormValues(term) : EMPTY_VALUES);
    }
  }, [open, term, reset]);

  async function onSubmit(values: CreateVocabularyTermFormValues) {
    const result = isEdit
      ? await updateVocabularyTermAction(term.id, values)
      : await createVocabularyTermAction(values);

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
          <VocabularyFormFields
            register={register}
            errors={errors}
            control={control}
            passages={passages}
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
