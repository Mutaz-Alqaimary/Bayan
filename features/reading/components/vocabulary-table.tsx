"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Languages,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildVocabularyColumns,
  vocabularyGlobalFilter,
} from "@/features/reading/components/vocabulary-columns";
import {
  passageTitle,
  vocabularyWord,
  type PassageOption,
  type VocabularyTermRecord,
} from "@/features/reading/types";
import { makeNameCollator } from "@/lib/collation";
import { formatDate, formatNumber } from "@/lib/format";

const PAGE_SIZE = 10;
const ALL_PASSAGES = "all";

type VocabularyTableProps = {
  terms: VocabularyTermRecord[];
  passages: PassageOption[];
  onAdd: () => void;
  onEdit: (term: VocabularyTermRecord) => void;
  onDelete: (term: VocabularyTermRecord) => void;
};

export function VocabularyTable({
  terms,
  passages,
  onAdd,
  onEdit,
  onDelete,
}: VocabularyTableProps) {
  const t = useTranslations("vocabulary");
  const locale = useLocale();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [passageFilter, setPassageFilter] = useState<string>(ALL_PASSAGES);

  const labels = useMemo(
    () => ({
      word: t("columns.word"),
      meaning: t("columns.meaning"),
      passage: t("columns.passage"),
      createdAt: t("columns.createdAt"),
      actions: t("columns.actions"),
      edit: t("actions.edit"),
      delete: t("actions.delete"),
      rowActions: t("actions.rowActions"),
      sortAsc: t("table.sortAsc"),
      sortDesc: t("table.sortDesc"),
      unknownPassage: t("columns.unknownPassage"),
    }),
    [t],
  );

  const columns = useMemo(
    () => buildVocabularyColumns({ locale, labels, passages, onEdit, onDelete }),
    [locale, labels, passages, onEdit, onDelete],
  );

  // Passages that actually have terms, ordered by title for the filter select.
  const passageById = useMemo(
    () => new Map(passages.map((p) => [p.id, p])),
    [passages],
  );
  const passageFilterOptions = useMemo(() => {
    const collator = makeNameCollator(locale);
    const present = [...new Set(terms.map((term) => term.passage_id))]
      .map((id) => passageById.get(id))
      .filter((p): p is PassageOption => p !== undefined);
    return present.sort((a, b) =>
      collator.compare(passageTitle(a, locale), passageTitle(b, locale)),
    );
  }, [terms, passageById, locale]);

  const table = useReactTable({
    data: terms,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: vocabularyGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  function handlePassageChange(value: string) {
    setPassageFilter(value);
    table
      .getColumn("passage")
      ?.setFilterValue(value === ALL_PASSAGES ? undefined : value);
  }

  function clearFilters() {
    setGlobalFilter("");
    setPassageFilter(ALL_PASSAGES);
    table.getColumn("passage")?.setFilterValue(undefined);
  }

  if (terms.length === 0) {
    return (
      <EmptyState
        icon={<Languages />}
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <Button onClick={onAdd}>
            <Plus className="size-4" aria-hidden="true" />
            {t("empty.action")}
          </Button>
        }
      />
    );
  }

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = terms.length;
  const cardLabels = {
    meaning: t("card.meaning"),
    passage: t("card.passage"),
    added: t("card.added"),
    rowActions: t("actions.rowActions"),
    edit: t("actions.edit"),
    delete: t("actions.delete"),
  };
  const titleOf = (passageId: string) => {
    const passage = passageById.get(passageId);
    return passage ? passageTitle(passage, locale) : labels.unknownPassage;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Label htmlFor="vocabulary-search" className="sr-only">
            {t("toolbar.searchLabel")}
          </Label>
          <Search
            className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="vocabulary-search"
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={t("toolbar.searchPlaceholder")}
            className="ps-9"
          />
        </div>

        <Select value={passageFilter} onValueChange={handlePassageChange}>
          <SelectTrigger
            className="w-full sm:w-64"
            aria-label={t("toolbar.passageLabel")}
          >
            <SelectValue placeholder={t("toolbar.passageAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PASSAGES}>
              {t("toolbar.passageAll")}
            </SelectItem>
            {passageFilterOptions.map((passage) => (
              <SelectItem key={passage.id} value={passage.id}>
                <span dir="auto">{passageTitle(passage, locale)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filteredCount === totalCount
          ? t("toolbar.count", { count: formatNumber(totalCount, locale) })
          : t("toolbar.countFiltered", {
              count: formatNumber(filteredCount, locale),
              total: formatNumber(totalCount, locale),
            })}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title={t("noResults.title")}
          description={t("noResults.description")}
          action={
            <Button variant="outline" onClick={clearFilters}>
              {t("noResults.action")}
            </Button>
          }
        />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <Table aria-label={t("table.label")}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <TableHead
                          key={header.id}
                          aria-sort={
                            !header.column.getCanSort()
                              ? undefined
                              : sorted === "asc"
                                ? "ascending"
                                : sorted === "desc"
                                  ? "descending"
                                  : "none"
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <VocabularyCard
                  term={row.original}
                  locale={locale}
                  passageLabel={titleOf(row.original.passage_id)}
                  labels={cardLabels}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </li>
            ))}
          </ul>

          {pageCount > 1 ? (
            <nav
              aria-label={t("table.pagination")}
              className="flex items-center justify-between gap-3"
            >
              <p className="text-sm text-muted-foreground">
                {t("table.pageStatus", {
                  page: formatNumber(
                    table.getState().pagination.pageIndex + 1,
                    locale,
                  ),
                  total: formatNumber(pageCount, locale),
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft
                    className="size-4 rtl:rotate-180"
                    aria-hidden="true"
                  />
                  {t("table.previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {t("table.next")}
                  <ChevronRight
                    className="size-4 rtl:rotate-180"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Compact vocabulary card for the mobile (phone) breakpoint. */
function VocabularyCard({
  term,
  locale,
  passageLabel,
  labels,
  onEdit,
  onDelete,
}: {
  term: VocabularyTermRecord;
  locale: string;
  passageLabel: string;
  labels: {
    meaning: string;
    passage: string;
    added: string;
    edit: string;
    delete: string;
    rowActions: string;
  };
  onEdit: (term: VocabularyTermRecord) => void;
  onDelete: (term: VocabularyTermRecord) => void;
}) {
  const word = vocabularyWord(term, locale);
  const meaning =
    locale === "en" && term.meaning_en ? term.meaning_en : term.meaning_ar;
  return (
    <Card className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <p dir="auto" className="truncate font-medium text-foreground">
          {word}
        </p>
        <p
          dir="auto"
          title={meaning}
          className="truncate text-sm text-muted-foreground"
        >
          <span className="sr-only">{labels.meaning}: </span>
          {meaning}
        </p>
        <p
          dir="auto"
          title={passageLabel}
          className="truncate text-xs text-muted-foreground pt-1"
        >
          <span className="sr-only">{labels.passage}: </span>
          {passageLabel}
        </p>
        <span className="text-xs text-muted-foreground">
          <span className="sr-only">{labels.added}: </span>
          {formatDate(term.created_at, locale)}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
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
    </Card>
  );
}
