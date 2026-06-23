"use client";

import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import {
  TextareaField,
  TextField,
} from "@/features/reading/components/reading-fields";
import type { CreatePassageFormValues } from "@/features/reading/types";

/**
 * The shared field set for create and edit passage forms. Arabic title/content
 * are required (primary); English title/content are optional. Difficulty and
 * estimated minutes are positive whole-number inputs. Arabic fields default to
 * RTL; English fields are forced `ltr`.
 */
export function PassageFormFields({
  register,
  errors,
  disabled,
}: {
  register: UseFormRegister<CreatePassageFormValues>;
  errors: FieldErrors<CreatePassageFormValues>;
  disabled?: boolean;
}) {
  const t = useTranslations("passages.fields");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="title_ar"
          label={t("titleAr")}
          required
          disabled={disabled}
          error={errors.title_ar?.message}
          registration={register("title_ar")}
        />
        <TextField
          id="title_en"
          label={t("titleEn")}
          dir="ltr"
          disabled={disabled}
          error={errors.title_en?.message}
          registration={register("title_en")}
        />
      </div>

      <TextareaField
        id="content_ar"
        label={t("contentAr")}
        required
        disabled={disabled}
        error={errors.content_ar?.message}
        registration={register("content_ar")}
      />
      <TextareaField
        id="content_en"
        label={t("contentEn")}
        dir="ltr"
        disabled={disabled}
        error={errors.content_en?.message}
        registration={register("content_en")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="difficulty_level"
          label={t("difficulty")}
          inputMode="numeric"
          dir="ltr"
          required
          disabled={disabled}
          error={errors.difficulty_level?.message}
          registration={register("difficulty_level")}
        />
        <TextField
          id="estimated_minutes"
          label={t("estimatedMinutes")}
          inputMode="numeric"
          dir="ltr"
          required
          disabled={disabled}
          error={errors.estimated_minutes?.message}
          registration={register("estimated_minutes")}
        />
      </div>
    </div>
  );
}
