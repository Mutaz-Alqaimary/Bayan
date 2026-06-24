"use client";

import { useLocale, useTranslations } from "next-intl";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/features/reading/components/reading-fields";
import {
  passageTitle,
  type CreateVocabularyTermFormValues,
  type PassageOption,
} from "@/features/reading/types";

/**
 * The shared field set for create and edit vocabulary forms. The passage
 * selector is required — terms are always scoped to a passage. Arabic word and
 * meaning are required (primary); English word and meaning are optional.
 */
export function VocabularyFormFields({
  register,
  errors,
  control,
  passages,
  disabled,
}: {
  register: UseFormRegister<CreateVocabularyTermFormValues>;
  errors: FieldErrors<CreateVocabularyTermFormValues>;
  control: Control<CreateVocabularyTermFormValues>;
  passages: PassageOption[];
  disabled?: boolean;
}) {
  const t = useTranslations("vocabulary.fields");
  const locale = useLocale();
  const passageErrorId = "passage_id-error";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="passage_id">
          {t("passage")}
          <span aria-hidden="true" className="ms-0.5 text-destructive-text">
            *
          </span>
        </Label>
        <Controller
          control={control}
          name="passage_id"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id="passage_id"
                aria-required
                aria-invalid={errors.passage_id ? true : undefined}
                aria-describedby={
                  errors.passage_id ? passageErrorId : undefined
                }
              >
                <SelectValue placeholder={t("passagePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {passages.map((passage) => (
                  <SelectItem key={passage.id} value={passage.id}>
                    <span dir="auto">{passageTitle(passage, locale)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.passage_id ? (
          <p
            id={passageErrorId}
            role="alert"
            className="text-sm text-destructive-text"
          >
            {errors.passage_id.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="word_ar"
          label={t("wordAr")}
          required
          disabled={disabled}
          error={errors.word_ar?.message}
          registration={register("word_ar")}
        />
        <TextField
          id="word_en"
          label={t("wordEn")}
          dir="ltr"
          disabled={disabled}
          error={errors.word_en?.message}
          registration={register("word_en")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="meaning_ar"
          label={t("meaningAr")}
          required
          disabled={disabled}
          error={errors.meaning_ar?.message}
          registration={register("meaning_ar")}
        />
        <TextField
          id="meaning_en"
          label={t("meaningEn")}
          dir="ltr"
          disabled={disabled}
          error={errors.meaning_en?.message}
          registration={register("meaning_en")}
        />
      </div>
    </div>
  );
}
