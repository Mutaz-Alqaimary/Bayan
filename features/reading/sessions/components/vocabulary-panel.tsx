"use client";

import { ChevronDown, RotateCw, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { vocabularyMeaning, vocabularyWord } from "@/features/reading/types";
import type { VocabularyTermRecord } from "@/features/reading/types";
import { makeNameCollator, normalizeForSearch } from "@/lib/collation";
import { cn } from "@/lib/utils";

/**
 * The vocabulary lookup state for the active passage. Loaded lazily when the
 * reader mounts (see `reading-runner.tsx`) so the panel can show loading, error,
 * and empty states independently of the passage text.
 */
export type VocabularyPanelState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; terms: VocabularyTermRecord[] };

/**
 * The vocabulary reading-aid panel: a searchable list of the passage's terms,
 * each revealing its meaning on tap. Pure presentational content shared by the
 * desktop sidebar and the mobile drawer — it owns search + per-term disclosure,
 * but not its own header/chrome (the host supplies that).
 *
 * Vocabulary here is strictly a lookup aid (word + meaning) — no quizzes,
 * flashcards, or progress tracking.
 */
export function VocabularyPanel({
  state,
  onRetry,
}: {
  state: VocabularyPanelState;
  onRetry: () => void;
}) {
  const t = useTranslations("readingSessions.reader.vocabulary");
  const locale = useLocale();
  const [query, setQuery] = useState("");

  // Sort once with an Arabic-aware collator (DB returns insertion order), then
  // filter by the normalized query across both scripts and the meaning.
  const terms = state.status === "ready" ? state.terms : null;
  const collator = useMemo(() => makeNameCollator(locale), [locale]);
  const sorted = useMemo(() => {
    if (!terms) return [];
    return [...terms].sort((a, b) =>
      collator.compare(vocabularyWord(a, locale), vocabularyWord(b, locale)),
    );
  }, [terms, collator, locale]);

  const filtered = useMemo(() => {
    const needle = normalizeForSearch(query);
    if (!needle) return sorted;
    return sorted.filter((term) => {
      const haystack = normalizeForSearch(
        `${term.word_ar} ${term.word_en ?? ""} ${term.meaning_ar} ${term.meaning_en ?? ""}`,
      );
      return haystack.includes(needle);
    });
  }, [sorted, query]);

  if (state.status === "loading") {
    return (
      <div className="space-y-3" aria-busy="true">
        <p role="status" className="sr-only">
          {t("loading")}
        </p>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title={t("error.title")}
        description={t("error.description")}
        action={
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden="true" />
            {t("error.retry")}
          </Button>
        }
      />
    );
  }

  if (sorted.length === 0) {
    return <EmptyState title={t("empty.title")} description={t("empty.description")} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="ps-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">
          {t("noMatches")}
        </p>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1">
          {filtered.map((term) => (
            <VocabularyItem key={term.id} term={term} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A single vocabulary term as an accessible disclosure: the word is always
 * visible; tapping reveals its meaning. Keeps the list scannable while a
 * definition stays one tap away — the approved "term lookup" interaction.
 */
function VocabularyItem({
  term,
  locale,
}: {
  term: VocabularyTermRecord;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const regionId = useId();

  const word = vocabularyWord(term, locale);
  const meaning = vocabularyMeaning(term, locale);
  // The secondary-script word, shown when distinct from the primary word.
  const secondary = locale === "en" ? term.word_ar : term.word_en;

  return (
    <li className="rounded-lg border border-border/60 bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <span className="flex-1 space-y-0.5">
          <span dir="auto" className="block font-semibold text-foreground">
            {word}
          </span>
          {secondary && secondary !== word ? (
            <span dir="auto" className="block text-xs text-muted-foreground">
              {secondary}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {/* Kept mounted (toggled with `hidden`) so the button's `aria-controls`
          always references a present element; `hidden` removes it from the a11y
          tree while collapsed. */}
      <p
        id={regionId}
        hidden={!open}
        dir="auto"
        className="border-t border-border/60 px-3 py-2.5 text-sm leading-relaxed text-foreground/80"
      >
        {meaning}
      </p>
    </li>
  );
}
