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
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
  buildPassageColumns,
  passageGlobalFilter,
} from "@/features/reading/components/passage-columns";
import {
  passageTitle,
  type ReadingPassageRecord,
} from "@/features/reading/types";
import { formatDate, formatNumber } from "@/lib/format";

const PAGE_SIZE = 10;
const ALL_DIFFICULTIES = "all";

type PassagesTableProps = {
  passages: ReadingPassageRecord[];
  onAdd: () => void;
  onEdit: (passage: ReadingPassageRecord) => void;
  onDelete: (passage: ReadingPassageRecord) => void;
};

export function PassagesTable({
  passages,
  onAdd,
  onEdit,
  onDelete,
}: PassagesTableProps) {
  const t = useTranslations("passages");
  const locale = useLocale();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] =
    useState<string>(ALL_DIFFICULTIES);

  const labels = useMemo(
    () => ({
      title: t("columns.title"),
      difficulty: t("columns.difficulty"),
      minutes: t("columns.minutes"),
      createdAt: t("columns.createdAt"),
      actions: t("columns.actions"),
      edit: t("actions.edit"),
      delete: t("actions.delete"),
      rowActions: t("actions.rowActions"),
      sortAsc: t("table.sortAsc"),
      sortDesc: t("table.sortDesc"),
    }),
    [t],
  );

  const columns = useMemo(
    () => buildPassageColumns({ locale, labels, onEdit, onDelete }),
    [locale, labels, onEdit, onDelete],
  );

  const difficultyOptions = useMemo(
    () =>
      [...new Set(passages.map((p) => p.difficulty_level))].sort(
        (a, b) => a - b,
      ),
    [passages],
  );

  const table = useReactTable({
    data: passages,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: passageGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  function handleDifficultyChange(value: string) {
    setDifficultyFilter(value);
    table
      .getColumn("difficulty_level")
      ?.setFilterValue(value === ALL_DIFFICULTIES ? undefined : Number(value));
  }

  function clearFilters() {
    setGlobalFilter("");
    setDifficultyFilter(ALL_DIFFICULTIES);
    table.getColumn("difficulty_level")?.setFilterValue(undefined);
  }

  if (passages.length === 0) {
    return (
      <EmptyState
        icon={<BookOpenText />}
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
  const totalCount = passages.length;
  const cardLabels = {
    difficulty: t("card.difficulty"),
    minutes: t("card.minutes"),
    added: t("card.added"),
    rowActions: t("actions.rowActions"),
    edit: t("actions.edit"),
    delete: t("actions.delete"),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Label htmlFor="passages-search" className="sr-only">
            {t("toolbar.searchLabel")}
          </Label>
          <Search
            className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="passages-search"
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={t("toolbar.searchPlaceholder")}
            className="ps-9"
          />
        </div>

        <Select value={difficultyFilter} onValueChange={handleDifficultyChange}>
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label={t("toolbar.difficultyLabel")}
          >
            <SelectValue placeholder={t("toolbar.difficultyAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_DIFFICULTIES}>
              {t("toolbar.difficultyAll")}
            </SelectItem>
            {difficultyOptions.map((level) => (
              <SelectItem key={level} value={String(level)}>
                {t("toolbar.difficultyOption", {
                  level: formatNumber(level, locale),
                })}
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
                <PassageCard
                  passage={row.original}
                  locale={locale}
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

/** Compact passage card for the mobile (phone) breakpoint. */
function PassageCard({
  passage,
  locale,
  labels,
  onEdit,
  onDelete,
}: {
  passage: ReadingPassageRecord;
  locale: string;
  labels: {
    difficulty: string;
    minutes: string;
    added: string;
    edit: string;
    delete: string;
    rowActions: string;
  };
  onEdit: (passage: ReadingPassageRecord) => void;
  onDelete: (passage: ReadingPassageRecord) => void;
}) {
  const title = passageTitle(passage, locale);
  return (
    <Card className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <p dir="auto" className="truncate font-medium text-foreground">
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">
            {labels.difficulty} {formatNumber(passage.difficulty_level, locale)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            <span className="sr-only">{labels.minutes}: </span>
            {formatNumber(passage.estimated_minutes, locale)}
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="sr-only">{labels.added}: </span>
            {formatDate(passage.created_at, locale)}
          </span>
        </div>
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
    </Card>
  );
}
