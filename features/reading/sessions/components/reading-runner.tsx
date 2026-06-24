"use client";

import { Languages, Square, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { loadPassageVocabularyAction } from "@/features/reading/sessions/actions";
import {
  VocabularyPanel,
  type VocabularyPanelState,
} from "@/features/reading/sessions/components/vocabulary-panel";
import type { ReadablePassage } from "@/features/reading/sessions/types";
import { passageTitle } from "@/features/reading/types";
import { formatDuration, formatNumber } from "@/lib/format";

/** The locale-appropriate reading content, falling back to Arabic. */
function passageContent(passage: ReadablePassage, locale: string): string {
  if (locale === "en" && passage.content_en) return passage.content_en;
  return passage.content_ar;
}

/**
 * "Read With Me" — the timed reading experience (Phase 11). A comfortable Arabic
 * reading column paired with a vocabulary lookup panel (a sticky sidebar on
 * desktop, a bottom drawer on mobile). The timer starts on mount and measures
 * elapsed time from a wall-clock reference (robust to dropped interval ticks);
 * vocabulary lookups happen while the clock runs, so they count as reading time.
 * Duration is handed back on Stop, feeding the existing Phase 10 review/complete
 * flow unchanged.
 *
 * The rapidly-updating clock is `aria-hidden`; a static status tells
 * screen-reader users a reading is in progress.
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
  const tv = useTranslations("readingSessions.reader.vocabulary");
  const locale = useLocale();
  const startRef = useRef<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [vocab, setVocab] = useState<VocabularyPanelState>({ status: "loading" });

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

  // The request itself is setState-free; callers apply the result. The reader
  // starts in "loading", so the mount effect only needs to resolve it (state is
  // set inside the async callback, not synchronously in the effect body); retry
  // resets to "loading" from its own event handler.
  const requestVocabulary = useCallback(
    () => loadPassageVocabularyAction(passage.id),
    [passage.id],
  );

  useEffect(() => {
    let active = true;
    void requestVocabulary().then((result) => {
      if (!active) return;
      setVocab(
        result.ok ? { status: "ready", terms: result.terms } : { status: "error" },
      );
    });
    return () => {
      active = false;
    };
  }, [requestVocabulary]);

  const handleRetryVocabulary = useCallback(() => {
    setVocab({ status: "loading" });
    void requestVocabulary().then((result) => {
      setVocab(
        result.ok ? { status: "ready", terms: result.terms } : { status: "error" },
      );
    });
  }, [requestVocabulary]);

  function handleStop() {
    const seconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    onStop(seconds);
  }

  const title = passageTitle(passage, locale);
  const vocabCount = vocab.status === "ready" ? vocab.terms.length : null;

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-6 sm:p-8">
          <p
            dir="auto"
            className="mx-auto max-w-[60ch] whitespace-pre-wrap text-lg leading-loose text-foreground sm:text-xl"
          >
            {passageContent(passage, locale)}
          </p>
        </Card>

        {/* Desktop: sticky vocabulary sidebar. */}
        <aside className="hidden lg:flex lg:max-h-[calc(100vh-3rem)] lg:flex-col lg:sticky lg:top-6 lg:gap-3 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Languages
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold text-foreground">
                {tv("title")}
              </h2>
              {vocabCount !== null ? (
                <Badge variant="secondary" className="ms-auto">
                  {formatNumber(vocabCount, locale)}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{tv("hint")}</p>
          </div>
          <VocabularyPanel state={vocab} onRetry={handleRetryVocabulary} />
        </aside>
      </div>

      {/* Mobile/tablet: vocabulary lookup in a bottom drawer, reachable from a
          fixed bar without scrolling the passage. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              <Languages className="size-4" aria-hidden="true" />
              {tv("openLabel")}
              {vocabCount !== null ? (
                <Badge variant="secondary">{formatNumber(vocabCount, locale)}</Badge>
              ) : null}
            </Button>
          </DrawerTrigger>
          <DrawerContent side="bottom" className="max-h-[80vh]">
            <DrawerHeader className="p-0">
              <DrawerTitle>{tv("title")}</DrawerTitle>
              <DrawerDescription>{tv("drawerDescription")}</DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col">
              <VocabularyPanel state={vocab} onRetry={handleRetryVocabulary} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
