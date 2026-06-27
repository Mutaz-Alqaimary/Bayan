"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { claimStudentRecordAction } from "@/features/students/identity/actions";
import { useClaimSchemaMessages } from "@/features/students/identity/components/use-claim-schema-messages";
import { buildClaimStudentSchema } from "@/features/students/identity/schemas";
import type { ClaimStudentFormValues } from "@/features/students/identity/types";
import { useRouter } from "@/i18n/navigation";

/**
 * Secure roster claim (Phase 12.5): a signed-in student links their account to an
 * existing school roster record using its `student_number` (the school-issued
 * code). On success the page re-reads and shows the linked reading experience.
 */
export function ClaimForm() {
  const t = useTranslations("students.identity.claim");
  const messages = useClaimSchemaMessages();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClaimStudentFormValues>({
    resolver: zodResolver(buildClaimStudentSchema(messages)),
    defaultValues: { student_number: "" },
  });

  async function onSubmit(values: ClaimStudentFormValues) {
    const result = await claimStudentRecordAction(values);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }
    toast({ title: t("successTitle"), description: t("successDescription") });
    router.refresh();
  }

  const errorId = "claim-student-number-error";

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <KeyRound className="size-4" />
        </span>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="claim-student-number">{t("codeLabel")}</Label>
          <Input
            id="claim-student-number"
            dir="ltr"
            autoComplete="off"
            placeholder={t("codePlaceholder")}
            disabled={isSubmitting}
            aria-invalid={errors.student_number ? true : undefined}
            aria-describedby={errors.student_number ? errorId : undefined}
            {...register("student_number")}
          />
          {errors.student_number ? (
            <p id={errorId} role="alert" className="text-sm text-destructive-text">
              {errors.student_number.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>
      </form>
    </Card>
  );
}
