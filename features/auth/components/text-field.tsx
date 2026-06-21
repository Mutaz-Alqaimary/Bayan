"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextFieldProps = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  type?: React.ComponentProps<"input">["type"];
  autoComplete?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  placeholder?: string;
  /** Force a direction (e.g. `ltr` for email) regardless of page locale. */
  dir?: "ltr" | "rtl";
  error?: string;
  disabled?: boolean;
};

/**
 * Labeled text input with localized, accessible error wiring. The error is
 * linked via `aria-describedby` and announced (`role="alert"`), and the input is
 * flagged with `aria-invalid` so assistive tech and the styled invalid state
 * stay in sync. Reused across every auth form.
 */
export function TextField({
  id,
  label,
  registration,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  dir,
  error,
  disabled,
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        dir={dir}
        disabled={disabled}
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
