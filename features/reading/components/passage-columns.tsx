"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  passageTitle,
  type ReadingPassageRecord,
} from "@/features/reading/types";
import { makeNameCollator, normalizeForSearch } from "@/lib/collation";
import { formatDate, formatNumber } from "@/lib/format";

export type PassageColumnLabels = {
  title: string;
  difficulty: string;
  minutes: string;
  createdAt: string;
  actions: string;
  edit: string;
  delete: string;
  rowActions: string;
  sortAsc: string;
  sortDesc: string;
};

type ColumnContext = {
  locale: string;
  labels: PassageColumnLabels;
  onEdit: (passage: ReadingPassageRecord) => void;
  onDelete: (passage: ReadingPassageRecord) => void;
};

/** Arabic-aware global search across title (ar + en) and content (ar + en). */
export const passageGlobalFilter: FilterFn<ReadingPassageRecord> = (
  row,
  _columnId,
  filterValue,
) => {
  const query = normalizeForSearch(String(filterValue ?? ""));
  if (!query) return true;
  const p = row.original;
  const haystack = normalizeForSearch(
    [
      p.title_ar,
      p.title_en ?? "",
      p.content_ar,
      p.content_en ?? "",
    ].join(" "),
  );
  return haystack.includes(query);
};

function sortHeader(label: string, labels: PassageColumnLabels) {
  return function Header({
    column,
  }: {
    column: Column<ReadingPassageRecord, unknown>;
  }) {
    return (
      <SortableHeader
        column={column}
        label={label}
        sortAscLabel={labels.sortAsc}
        sortDescLabel={labels.sortDesc}
      />
    );
  };
}

export function buildPassageColumns({
  locale,
  labels,
  onEdit,
  onDelete,
}: ColumnContext): ColumnDef<ReadingPassageRecord>[] {
  const collator = makeNameCollator(locale);

  return [
    {
      id: "title",
      accessorFn: (passage) => passageTitle(passage, locale),
      enableGlobalFilter: true,
      filterFn: passageGlobalFilter,
      header: sortHeader(labels.title, labels),
      sortingFn: (rowA, rowB) =>
        collator.compare(
          passageTitle(rowA.original, locale),
          passageTitle(rowB.original, locale),
        ),
      cell: ({ row }) => {
        const passage = row.original;
        const primary = passageTitle(passage, locale);
        const secondary =
          locale === "en" ? passage.title_ar : passage.title_en;
        return (
          <div className="flex max-w-xs flex-col">
            <span
              dir="auto"
              title={primary}
              className="truncate font-medium text-foreground"
            >
              {primary}
            </span>
            {secondary ? (
              // `dir="auto"` so direction follows the actual script of the
              // value rather than assuming it matches the field's language.
              <span
                dir="auto"
                title={secondary}
                className="truncate text-xs text-muted-foreground"
              >
                {secondary}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "difficulty_level",
      enableGlobalFilter: false,
      filterFn: "equals",
      header: sortHeader(labels.difficulty, labels),
      cell: ({ row }) => formatNumber(row.original.difficulty_level, locale),
    },
    {
      accessorKey: "estimated_minutes",
      enableGlobalFilter: false,
      header: sortHeader(labels.minutes, labels),
      cell: ({ row }) => formatNumber(row.original.estimated_minutes, locale),
    },
    {
      accessorKey: "created_at",
      enableGlobalFilter: false,
      header: sortHeader(labels.createdAt, labels),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at, locale)}
        </span>
      ),
    },
    {
      id: "actions",
      enableGlobalFilter: false,
      enableSorting: false,
      header: () => <span className="sr-only">{labels.actions}</span>,
      cell: ({ row }) => {
        const passage = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={labels.rowActions}
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(passage)}>
                  {labels.edit}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive-text focus:text-destructive-text"
                  onSelect={() => onDelete(passage)}
                >
                  {labels.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
