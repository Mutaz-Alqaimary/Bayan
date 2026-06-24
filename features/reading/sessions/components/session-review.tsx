"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeFluency } from "@/features/reading/sessions/fluency";
import type { ReadablePassage } from "@/features/reading/sessions/types";
import { formatDuration, formatNumber, formatPercent } from "@/lib/format";

/**
 * After-reading review: the student reports miscued words, sees the resulting
 * speed/accuracy update live (with the formula spelled out for transparency),
 * then confirms to save. Submission is owned by the parent; `submitting`
 * disables the confirm control to block double-submits.
 */
export function SessionReview({
  passage,
  durationSeconds,
  submitting,
  onConfirm,
  onBack,
}: {
  passage: ReadablePassage;
  durationSeconds: number;
  submitting: boolean;
  onConfirm: (errors: number) => void;
  onBack: () => void;
}) {
  const t = useTranslations("readingSessions.review");
  const locale = useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [errors, setErrors] = useState(0);

  const wordCount = passage.word_count;

  // Land focus on the heading when this phase takes over the view.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function clamp(value: number): number {
    if (Number.isNaN(value)) return 0;
    return Math.min(Math.max(Math.round(value), 0), wordCount);
  }

  const { wordsPerMinute, accuracyPercentage } = computeFluency({
    wordCount,
    durationSeconds,
    errors,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-foreground focus-visible:outline-none"
        >
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Scoped polite status: announces only the recomputed metrics when the
          miscue count changes (not the unchanging duration), as one update. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {t("metrics.wpm")}: {formatNumber(wordsPerMinute, locale)} ·{" "}
        {t("metrics.accuracy")}: {formatPercent(accuracyPercentage, locale)}
      </p>

      <Card className="space-y-5 p-6">
        {/* Miscue stepper */}
        <div className="space-y-2">
          <Label htmlFor="session-errors">{t("errorsLabel")}</Label>
          <p id="session-errors-hint" className="text-sm text-muted-foreground">
            {t("errorsHint", { count: formatNumber(wordCount, locale) })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setErrors((value) => clamp(value - 1))}
              disabled={submitting || errors <= 0}
              aria-label={`${t("errorsLabel")} — ${t("decrease")}`}
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <Input
              id="session-errors"
              type="number"
              inputMode="numeric"
              min={0}
              max={wordCount}
              dir="ltr"
              value={errors}
              disabled={submitting}
              aria-describedby="session-errors-hint"
              onChange={(event) => setErrors(clamp(Number(event.target.value)))}
              className="w-24 text-center tabular-nums"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setErrors((value) => clamp(value + 1))}
              disabled={submitting || errors >= wordCount}
              aria-label={`${t("errorsLabel")} — ${t("increase")}`}
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Computed metrics (announced via the scoped status region above). */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Metric label={t("metrics.duration")} value={formatDuration(durationSeconds, locale)} ltr />
          <Metric
            label={t("metrics.wpm")}
            value={formatNumber(wordsPerMinute, locale)}
          />
          <Metric
            label={t("metrics.accuracy")}
            value={formatPercent(accuracyPercentage, locale)}
          />
        </div>

        {/* Formula, for teacher-checkable transparency. Guarded against a
            zero-word passage (unreachable via the locked passage schema, which
            requires non-empty content, but never show a divide-by-zero). */}
        {wordCount > 0 ? (
          <div className="rounded-lg bg-muted p-4 text-xs text-foreground/80">
            <p className="font-medium text-foreground">{t("formula.title")}</p>
            <p dir="ltr" className="mt-1 tabular-nums">
              {t("formula.wpm", {
                words: formatNumber(wordCount, locale),
                seconds: formatNumber(durationSeconds, locale),
                wpm: formatNumber(wordsPerMinute, locale),
              })}
            </p>
            <p dir="ltr" className="tabular-nums">
              {t("formula.accuracy", {
                words: formatNumber(wordCount, locale),
                errors: formatNumber(errors, locale),
                accuracy: formatNumber(accuracyPercentage, locale),
              })}
            </p>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
        >
          {t("back")}
        </Button>
        <Button
          type="button"
          onClick={() => onConfirm(errors)}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("saving")}
            </>
          ) : (
            t("confirm")
          )}
        </Button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 text-center">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        dir={ltr ? "ltr" : undefined}
        className="mt-1 text-xl font-bold tabular-nums text-foreground"
      >
        {value}
      </p>
    </div>
  );
}
