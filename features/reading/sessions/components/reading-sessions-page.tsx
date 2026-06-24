"use client";

import { BookOpen, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { completeReadingSessionAction } from "@/features/reading/sessions/actions";
import { ReadingHistoryPanel } from "@/features/reading/sessions/components/reading-history";
import { ReadingRunner } from "@/features/reading/sessions/components/reading-runner";
import { SessionReview } from "@/features/reading/sessions/components/session-review";
import type {
  ReadablePassage,
  ReadingSessionsData,
} from "@/features/reading/sessions/types";
import { passageTitle } from "@/features/reading/types";
import { useRouter } from "@/i18n/navigation";
import { formatNumber } from "@/lib/format";

type Phase = "home" | "reading" | "review";

export function ReadingSessionsPage({ data }: { data: ReadingSessionsData }) {
  const t = useTranslations("readingSessions");
  const locale = useLocale();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("home");
  const [selectedId, setSelectedId] = useState("");
  const [activePassage, setActivePassage] = useState<ReadablePassage | null>(
    null,
  );
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // Synchronous guard so a fast double-confirm can't fire two submissions
  // before React re-renders the disabled button.
  const submittingRef = useRef(false);

  // Restore focus to the home heading when returning from the reading/review
  // views (the control that was activated has unmounted). Runner/review focus
  // their own headings on mount, so this only handles the trip back to home.
  const homeHeadingRef = useRef<HTMLHeadingElement>(null);
  const prevPhaseRef = useRef<Phase>("home");
  useEffect(() => {
    if (phase === "home" && prevPhaseRef.current !== "home") {
      homeHeadingRef.current?.focus();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // Onboarding: a self-registered student with no linked roster row yet.
  if (!data.linked) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
        </header>
        <EmptyState
          icon={<BookOpen />}
          title={t("unlinked.title")}
          description={t("unlinked.description")}
        />
      </div>
    );
  }

  const { passages, history } = data;

  function startReading() {
    const passage = passages.find((p) => p.id === selectedId);
    if (!passage) return;
    setActivePassage(passage);
    setDuration(0);
    setPhase("reading");
  }

  function handleStop(seconds: number) {
    setDuration(seconds);
    setPhase("review");
  }

  function resetToHome() {
    setPhase("home");
    setActivePassage(null);
    setDuration(0);
    setSelectedId("");
  }

  async function handleConfirm(errors: number) {
    if (!activePassage || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const result = await completeReadingSessionAction({
      passage_id: activePassage.id,
      duration_seconds: String(duration),
      errors: String(errors),
    });

    setSubmitting(false);
    submittingRef.current = false;

    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }

    toast({
      title: t("toasts.savedTitle"),
      description: result.duplicate
        ? t("toasts.alreadySaved")
        : t("toasts.savedDescription"),
    });
    resetToHome();
    router.refresh();
  }

  if (phase === "reading" && activePassage) {
    return (
      <ReadingRunner
        passage={activePassage}
        onStop={handleStop}
        onCancel={resetToHome}
      />
    );
  }

  if (phase === "review" && activePassage) {
    return (
      <SessionReview
        passage={activePassage}
        durationSeconds={duration}
        submitting={submitting}
        onConfirm={handleConfirm}
        onBack={resetToHome}
      />
    );
  }

  const selectedPassage = passages.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1
          ref={homeHeadingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight text-foreground focus-visible:outline-none"
        >
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </header>

      {passages.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t("noPassages.title")}
          description={t("noPassages.description")}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              {t("start.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("start.description")}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label
                id="passage-select-label"
                htmlFor="passage-select"
                className="text-sm font-medium text-foreground"
              >
                {t("start.passageLabel")}
              </label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger
                  id="passage-select"
                  aria-labelledby="passage-select-label"
                >
                  <SelectValue placeholder={t("start.passagePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {passages.map((passage) => (
                    <SelectItem key={passage.id} value={passage.id}>
                      {passageTitle(passage, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={startReading} disabled={!selectedPassage}>
              <Play className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("start.action")}
            </Button>
          </div>

          {selectedPassage ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("start.meta", {
                words: formatNumber(selectedPassage.word_count, locale),
                minutes: formatNumber(selectedPassage.estimated_minutes, locale),
                level: formatNumber(selectedPassage.difficulty_level, locale),
              })}
            </p>
          ) : null}
        </div>
      )}

      <ReadingHistoryPanel history={history} />
    </div>
  );
}
