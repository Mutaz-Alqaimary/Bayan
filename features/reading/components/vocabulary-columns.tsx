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
  vocabularyWord,
  type PassageOption,
  type VocabularyTermRecord,
} from "@/features/reading/types";
import { makeNameCollator, normalizeForSearch } from "@/lib/collation";
import { formatDate } from "@/lib/format";

export type VocabularyColumnLabels = {
  word: string;
  meaning: string;
  passage: string;
  createdAt: string;
  actions: string;
  edit: string;
  delete: string;
  rowActions: string;
  sortAsc: string;
  sortDesc: string;
  unknownPassage: string;
};

type ColumnContext = {
  locale: string;
  labels: VocabularyColumnLabels;
  passages: PassageOption[];
  onEdit: (term: VocabularyTermRecord) => void;
  onDelete: (term: VocabularyTermRecord) => void;
};

/** Arabic-aware global search across word (ar + en) and meaning (ar + en). */
export const vocabularyGlobalFilter: FilterFn<VocabularyTermRecord> = (
  row,
  _columnId,
  filterValue,
) => {
  const query = normalizeForSearch(String(filterValue ?? ""));
  if (!query) return true;
  const term = row.original;
  const haystack = normalizeForSearch(
    [
      term.word_ar,
      term.word_en ?? "",
      term.meaning_ar,
      term.meaning_en ?? "",
    ].join(" "),
  );
  return haystack.includes(query);
};

function sortHeader(label: string, labels: VocabularyColumnLabels) {
  return function Header({
    column,
  }: {
    column: Column<VocabularyTermRecord, unknown>;
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

export function buildVocabularyColumns({
  locale,
  labels,
  passages,
  onEdit,
  onDelete,
}: ColumnContext): ColumnDef<VocabularyTermRecord>[] {
  const collator = makeNameCollator(locale);
  const passageById = new Map(passages.map((p) => [p.id, p]));

  const titleOf = (passageId: string): string => {
    const passage = passageById.get(passageId);
    return passage ? passageTitle(passage, locale) : labels.unknownPassage;
  };

  return [
    {
      id: "word",
      accessorFn: (term) => vocabularyWord(term, locale),
      enableGlobalFilter: true,
      filterFn: vocabularyGlobalFilter,
      header: sortHeader(labels.word, labels),
      sortingFn: (rowA, rowB) =>
        collator.compare(
          vocabularyWord(rowA.original, locale),
          vocabularyWord(rowB.original, locale),
        ),
      cell: ({ row }) => {
        const term = row.original;
        const primary = vocabularyWord(term, locale);
        const secondary = locale === "en" ? term.word_ar : term.word_en;
        return (
          <div className="flex flex-col">
            <span dir="auto" className="font-medium text-foreground">
              {primary}
            </span>
            {secondary ? (
              // `dir="auto"` so direction follows the value's actual script.
              <span dir="auto" className="text-xs text-muted-foreground">
                {secondary}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "meaning",
      enableGlobalFilter: false,
      enableSorting: false,
      // Plain label (no sort button) — styled to align with the sortable headers
      // while clearly not offering a sort affordance.
      header: () => <span className="px-2 font-medium">{labels.meaning}</span>,
      cell: ({ row }) => {
        const term = row.original;
        const meaning =
          locale === "en" && term.meaning_en
            ? term.meaning_en
            : term.meaning_ar;
        return (
          <span
            dir="auto"
            title={meaning}
            className="block max-w-72 truncate text-muted-foreground"
          >
            {meaning}
          </span>
        );
      },
    },
    {
      id: "passage",
      accessorFn: (term) => term.passage_id,
      enableGlobalFilter: false,
      filterFn: "equals",
      header: sortHeader(labels.passage, labels),
      sortingFn: (rowA, rowB) =>
        collator.compare(
          titleOf(rowA.original.passage_id),
          titleOf(rowB.original.passage_id),
        ),
      cell: ({ row }) => {
        const title = titleOf(row.original.passage_id);
        return (
          <span dir="auto" title={title} className="block max-w-48 truncate">
            {title}
          </span>
        );
      },
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
        const term = row.original;
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
                <DropdownMenuItem onSelect={() => onEdit(term)}>
                  {labels.edit}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive-text focus:text-destructive-text"
                  onSelect={() => onDelete(term)}
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
