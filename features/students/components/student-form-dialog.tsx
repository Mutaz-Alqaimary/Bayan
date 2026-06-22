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
  createStudentAction,
  updateStudentAction,
} from "@/features/students/actions";
import { StudentFormFields } from "@/features/students/components/student-form-fields";
import { useStudentSchemaMessages } from "@/features/students/components/use-student-schema-messages";
import { buildCreateStudentSchema } from "@/features/students/schemas";
import type {
  CreateStudentFormValues,
  StudentRecord,
} from "@/features/students/types";
import { useRouter } from "@/i18n/navigation";

const EMPTY_VALUES: CreateStudentFormValues = {
  student_number: "",
  first_name_ar: "",
  last_name_ar: "",
  first_name_en: "",
  last_name_en: "",
  email: "",
  grade: "",
  birth_date: "",
};

/** Map an existing roster record to the (all-strings) form shape for editing. */
function toFormValues(student: StudentRecord): CreateStudentFormValues {
  return {
    student_number: student.student_number,
    first_name_ar: student.first_name_ar,
    last_name_ar: student.last_name_ar,
    first_name_en: student.first_name_en ?? "",
    last_name_en: student.last_name_en ?? "",
    email: student.email,
    grade: String(student.grade),
    birth_date: student.birth_date ?? "",
  };
}

/**
 * Create/edit roster record dialog. When `student` is null it creates; otherwise
 * it edits that record. Reuses the same Zod schema and field set for both modes;
 * on success it shows a localized toast, closes, and refreshes the server-rendered
 * roster.
 */
export function StudentFormDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRecord | null;
}) {
  const t = useTranslations("students");
  const messages = useStudentSchemaMessages();
  const router = useRouter();
  const isEdit = student !== null;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentFormValues>({
    resolver: zodResolver(buildCreateStudentSchema(messages)),
    defaultValues: EMPTY_VALUES,
  });

  // Reset to the active record (or blanks) whenever the dialog opens, so a
  // reused dialog never shows a previous student's values.
  useEffect(() => {
    if (open) {
      reset(student ? toFormValues(student) : EMPTY_VALUES);
    }
  }, [open, student, reset]);

  async function onSubmit(values: CreateStudentFormValues) {
    const result = isEdit
      ? await updateStudentAction(student.id, values)
      : await createStudentAction(values);

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const fieldError of result.fieldErrors) {
          setError(fieldError.field, { message: fieldError.message });
        }
      }
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("form.editDescription") : t("form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <StudentFormFields
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
