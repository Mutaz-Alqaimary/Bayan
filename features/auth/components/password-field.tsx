"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Accessible labels for the visibility toggle. */
  showLabel: string;
  hideLabel: string;
};

/**
 * Password input with an accessible show/hide toggle. The toggle is a real
 * button with `aria-pressed` and a localized label; the field keeps the same
 * `aria-invalid` / `aria-describedby` error wiring as `TextField`. Direction is
 * forced to `ltr` since passwords are entered left-to-right even on Arabic pages,
 * and the toggle sits at the inline-end via logical positioning so it mirrors in
 * RTL automatically.
 */
export function PasswordField({
  id,
  label,
  registration,
  autoComplete,
  placeholder,
  error,
  disabled,
  showLabel,
  hideLabel,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          dir="ltr"
          disabled={disabled}
          className="pe-10"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? hideLabel : showLabel}
          title={visible ? hideLabel : showLabel}
          className={cn(
            "absolute inset-y-0 inset-e-0 flex items-center justify-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
            "rounded-md",
          )}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
