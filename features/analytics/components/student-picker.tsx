"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  ANALYTICS_RANGE_PARAM,
  ANALYTICS_STUDENT_PARAM,
} from "@/features/analytics/search-params";
import type { TimeRange } from "@/features/analytics/time-range";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

/** A student reduced to what the picker needs. */
export type PickerStudent = { id: string; name: string };

/** Cap on rendered matches so the dropdown stays scannable. */
const MAX_MATCHES = 8;

/**
 * Secondary, type-to-filter student lookup (spec §7) — the overview cards/needs
 * attention are the primary drill-down path. Each match is a real link into the
 * per-student view (no client navigation state). Arabic-aware substring match.
 */
export function StudentPicker({
  students,
  range,
  label,
  placeholder,
  emptyText,
}: {
  students: PickerStudent[];
  range: TimeRange;
  label: string;
  placeholder: string;
  emptyText: string;
}) {
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
                    pathname: ROUTES.analytics,
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
