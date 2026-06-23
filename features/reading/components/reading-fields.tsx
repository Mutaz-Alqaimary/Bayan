"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Labeled inputs with accessible, localized error wiring (error linked via
 * `aria-describedby`, announced with `role="alert"`, input flagged
 * `aria-invalid`). Feature-local primitives composed by the passage and
 * vocabulary field sets.
 */

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span aria-hidden="true" className="ms-0.5 text-destructive-text">
          *
        </span>
      ) : null}
    </Label>
  );
}

export function TextField({
  id,
  label,
  registration,
  error,
  type = "text",
  dir,
  inputMode,
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
  required?: boolean;
  disabled?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        type={type}
        dir={dir}
        inputMode={inputMode}
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

export function TextareaField({
  id,
  label,
  registration,
  error,
  dir,
  required,
  disabled,
  rows = 6,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  dir?: "ltr" | "rtl";
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Textarea
        id={id}
        dir={dir}
        rows={rows}
        disabled={disabled}
        // Comfortable line height for sustained Arabic reading/editing.
        className="leading-loose"
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
