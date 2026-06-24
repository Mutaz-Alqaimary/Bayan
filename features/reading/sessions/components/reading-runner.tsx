"use client";

import { Square, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { passageTitle } from "@/features/reading/types";
import type { ReadablePassage } from "@/features/reading/sessions/types";
import { formatDuration, formatNumber } from "@/lib/format";

/** The locale-appropriate reading content, falling back to Arabic. */
function passageContent(passage: ReadablePassage, locale: string): string {
  if (locale === "en" && passage.content_en) return passage.content_en;
  return passage.content_ar;
}

/**
 * The timed reading view. The timer starts on mount and measures elapsed time
 * from a wall-clock reference (robust to dropped interval ticks). Duration is
 * handed back on Stop. The rapidly-updating clock is `aria-hidden`; a static
 * status tells screen-reader users a reading is in progress.
 *
 * This is a deliberately minimal reader — the immersive reader + inline
 * vocabulary arrive in Phase 11 ("Read With Me").
 */
export function ReadingRunner({
  passage,
  onStop,
  onCancel,
}: {
  passage: ReadablePassage;
  onStop: (durationSeconds: number) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("readingSessions.runner");
  const locale = useLocale();
  const startRef = useRef<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Anchor the start time on mount (not during render — that would be impure).
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Move focus to the heading when this phase takes over the view, so a
  // keyboard/screen-reader user lands here instead of on a now-removed button.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function handleStop() {
    const seconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    onStop(seconds);
  }

  const title = passageTitle(passage, locale);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight text-foreground focus-visible:outline-none"
          >
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("wordCount", {
              count: formatNumber(passage.word_count, locale),
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Not role="timer": the ticking value is aria-hidden to avoid
              per-second chatter, so the static role="status" line below is the
              accessible substitute. */}
          <div className="rounded-lg border border-border bg-card px-4 py-2 text-center">
            <span className="block text-xs font-medium text-muted-foreground">
              {t("elapsed")}
            </span>
            <span
              dir="ltr"
              aria-hidden="true"
              className="block text-2xl font-bold tabular-nums text-foreground"
            >
              {formatDuration(elapsed, locale)}
            </span>
          </div>
          <Button type="button" onClick={handleStop}>
            <Square className="size-4" aria-hidden="true" />
            {t("stop")}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">{t("cancel")}</span>
          </Button>
        </div>
      </div>

      <p role="status" className="sr-only">
        {t("inProgress")}
      </p>

      <Card className="p-6 sm:p-8">
        <p
          dir="auto"
          className="mx-auto max-w-prose whitespace-pre-wrap text-lg leading-loose text-foreground"
        >
          {passageContent(passage, locale)}
        </p>
      </Card>
    </div>
  );
}
