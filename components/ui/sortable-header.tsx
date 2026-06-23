"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A sortable TanStack column header rendered as a real button with a direction
 * icon. The visible label is the accessible name; current sort state is conveyed
 * by `aria-sort` on the parent `<th>` (set by the table), and `title` advertises
 * the next action to sighted users without overriding the name. Shared across
 * every data table (students, passages, vocabulary).
 */
export function SortableHeader<TData>({
  column,
  label,
  sortAscLabel,
  sortDescLabel,
}: {
  column: Column<TData, unknown>;
  label: string;
  sortAscLabel: string;
  sortDescLabel: string;
}) {
  const sorted = column.getIsSorted();
  const nextHint = sorted === "asc" ? sortDescLabel : sortAscLabel;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={
        sorted
          ? "-ms-2 h-8 gap-1.5 px-2 text-foreground"
          : "-ms-2 h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
      }
      onClick={() => column.toggleSorting(sorted === "asc")}
      title={nextHint}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" aria-hidden="true" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" aria-hidden="true" />
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
      )}
    </Button>
  );
}
