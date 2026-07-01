"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  ANALYTICS_RANGE_PARAM,
  ANALYTICS_STUDENT_PARAM,
} from "@/features/analytics/search-params";
import type { TimeRange } from "@/features/analytics/time-range";
import { Link } from "@/i18n/navigation";
import { ROUTES, type AppRoute } from "@/lib/routes";

/** A student reduced to what the picker needs. */
export type PickerStudent = { id: string; name: string };

/** Cap on rendered matches so the dropdown stays scannable. */
const MAX_MATCHES = 8;

/**
 * Secondary, type-to-filter student lookup (spec §7) — the overview cards/needs
 * attention are the primary drill-down path. Each match is a real link into the
 * per-student view (no client navigation state). Arabic-aware substring match.
 *
 * `pathname` defaults to `/analytics` (Phase 13) but is overridable so the same
 * picker drills into a per-student **report** on `/reports` (Phase 18) without
 * duplicating the client filtering / live-count-announcement logic.
 */
export function StudentPicker({
  students,
  range,
  label,
  placeholder,
  emptyText,
  pathname = ROUTES.analytics,
}: {
  students: PickerStudent[];
  range: TimeRange;
  label: string;
  placeholder: string;
  emptyText: string;
  pathname?: AppRoute;
}) {
  // The count line is resolved here (not passed in) because it depends on the
  // live match count; the parent is a Server Component and can't pass a
  // count-formatting function across the boundary.
  const t = useTranslations("analytics");
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLocaleLowerCase();
  const matches =
    trimmed === ""
      ? []
      : students
          .filter((student) =>
            student.name.toLocaleLowerCase().includes(trimmed),
          )
          .slice(0, MAX_MATCHES);

  return (
    <div className="relative w-full">
      <label htmlFor="analytics-student-search" className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="analytics-student-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="ps-9"
          autoComplete="off"
        />
      </div>
      {/* Status message (WCAG 4.1.3): announce the live result count to screen
          readers as the query changes — mirrors the roster table's announced
          count. The visible list below carries the same info for sighted users. */}
      <p role="status" aria-live="polite" className="sr-only">
        {trimmed !== "" ? t("students.searchResults", { count: matches.length }) : ""}
      </p>
      {trimmed !== "" ? (
        <ul className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-sm">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {emptyText}
            </li>
          ) : (
            matches.map((student) => (
              <li key={student.id}>
                <Link
                  href={{
                    pathname,
                    query: {
                      [ANALYTICS_RANGE_PARAM]: range,
                      [ANALYTICS_STUDENT_PARAM]: student.id,
                    },
                  }}
                  className="block truncate rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  {student.name}
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
