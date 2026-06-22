"use client";

import { useTranslations } from "next-intl";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormRegisterReturn,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateStudentFormValues } from "@/features/students/types";

/**
 * Labeled input with accessible, localized error wiring (the error is linked via
 * `aria-describedby`, announced with `role="alert"`, and the input flagged
 * `aria-invalid`). Feature-local — composes the shared `Input`/`Label` primitives
 * for the student forms.
 */
function Field({
  id,
  label,
  registration,
  error,
  type = "text",
  dir,
  inputMode,
  autoComplete,
  required,
  disabled,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  type?: React.ComponentProps<"input">["type"];
  dir?: "ltr" | "rtl";
  inputMode?: React.ComponentProps<"input">["inputMode"];
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-0.5 text-destructive-text">
            *
          </span>
        ) : null}
      </Label>
      <Input
        id={id}
        type={type}
        dir={dir}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The shared field set for create and edit. Arabic names are required (primary);
 * English names and birth date are optional. Email and student number are forced
 * `ltr` so embedded Latin/digits don't visually scramble inside the RTL form.
 */
export function StudentFormFields({
  register,
  errors,
  disabled,
}: {
  register: UseFormRegister<CreateStudentFormValues>;
  errors: FieldErrors<CreateStudentFormValues>;
  disabled?: boolean;
}) {
  const t = useTranslations("students.fields");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        id="first_name_ar"
        label={t("firstNameAr")}
        required
        disabled={disabled}
        error={errors.first_name_ar?.message}
        registration={register("first_name_ar")}
      />
      <Field
        id="last_name_ar"
        label={t("lastNameAr")}
        required
        disabled={disabled}
        error={errors.last_name_ar?.message}
        registration={register("last_name_ar")}
      />
      <Field
        id="first_name_en"
        label={t("firstNameEn")}
        dir="ltr"
        disabled={disabled}
        error={errors.first_name_en?.message}
        registration={register("first_name_en")}
      />
      <Field
        id="last_name_en"
        label={t("lastNameEn")}
        dir="ltr"
        disabled={disabled}
        error={errors.last_name_en?.message}
        registration={register("last_name_en")}
      />
      <Field
        id="student_number"
        label={t("studentNumber")}
        required
        dir="ltr"
        disabled={disabled}
        error={errors.student_number?.message}
        registration={register("student_number")}
      />
      <Field
        id="email"
        label={t("email")}
        type="email"
        dir="ltr"
        inputMode="email"
        autoComplete="off"
        required
        disabled={disabled}
        error={errors.email?.message}
        registration={register("email")}
      />
      <Field
        id="grade"
        label={t("grade")}
        inputMode="numeric"
        required
        disabled={disabled}
        error={errors.grade?.message}
        registration={register("grade")}
      />
      <Field
        id="birth_date"
        label={t("birthDate")}
        type="date"
        dir="ltr"
        disabled={disabled}
        error={errors.birth_date?.message}
        registration={register("birth_date")}
      />
    </div>
  );
}
