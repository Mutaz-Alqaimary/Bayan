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
  GraduationCap,
  MoreHorizontal,
  Search,
  UserPlus,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  buildTeacherColumns,
  TeacherStatusBadge,
  teacherGlobalFilter,
  type TeacherStatusLabels,
} from "@/features/teachers/components/teacher-columns";
import type { TeacherView } from "@/features/teachers/types";
import { formatDate, formatNumber } from "@/lib/format";

const PAGE_SIZE = 10;
const ALL_STATUSES = "all";

type TeachersTableProps = {
  teachers: TeacherView[];
  onPromote: () => void;
  onDemote: (teacher: TeacherView) => void;
};

export function TeachersTable({
  teachers,
  onPromote,
  onDemote,
}: TeachersTableProps) {
  const t = useTranslations("teachers");
  const locale = useLocale();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);

  const statusLabels = useMemo<TeacherStatusLabels>(
    () => ({
      header: t("columns.status"),
      invited: t("status.invited"),
      active: t("status.active"),
    }),
    [t],
  );

  const labels = useMemo(
    () => ({
      name: t("columns.name"),
      email: t("columns.email"),
      createdAt: t("columns.createdAt"),
      actions: t("columns.actions"),
      demote: t("actions.demote"),
      rowActions: t("actions.rowActions"),
      sortAsc: t("table.sortAsc"),
      sortDesc: t("table.sortDesc"),
      status: statusLabels,
    }),
    [t, statusLabels],
  );

  const columns = useMemo(
    () => buildTeacherColumns({ locale, labels, onDemote }),
    [locale, labels, onDemote],
  );

  const table = useReactTable({
    data: teachers,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: teacherGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    table
      .getColumn("status")
      ?.setFilterValue(value === ALL_STATUSES ? undefined : value);
  }

  function clearFilters() {
    setGlobalFilter("");
    setStatusFilter(ALL_STATUSES);
    table.getColumn("status")?.setFilterValue(undefined);
  }

  // No teachers at all → onboarding empty state (distinct from "no results").
  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap />}
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <Button onClick={onPromote}>
            <UserPlus className="size-4" aria-hidden="true" />
            {t("empty.action")}
          </Button>
        }
      />
    );
  }

  const rows = table.getRowModel().rows;
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = teachers.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Label htmlFor="teachers-search" className="sr-only">
            {t("toolbar.searchLabel")}
          </Label>
          <Search
            className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="teachers-search"
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={t("toolbar.searchPlaceholder")}
            className="ps-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label={t("toolbar.statusLabel")}
          >
            <SelectValue placeholder={t("toolbar.statusAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>{t("toolbar.statusAll")}</SelectItem>
            <SelectItem value="active">{t("status.active")}</SelectItem>
            <SelectItem value="invited">{t("status.invited")}</SelectItem>
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
          {/* Desktop / tablet table */}
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

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <TeacherCard
                  teacher={row.original}
                  locale={locale}
                  labels={{
                    email: t("columns.email"),
                    added: t("card.added"),
                    rowActions: t("actions.rowActions"),
                    demote: t("actions.demote"),
                    status: statusLabels,
                  }}
                  onDemote={onDemote}
                />
              </li>
            ))}
          </ul>

          {pageCount > 1 ? (
            <nav
              aria-label={t("table.pagination")}
              className="flex items-center justify-between gap-3"
            >
              <p className="text-sm text-muted-foreground" aria-live="polite">
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

/** Compact teacher card for the mobile (phone) breakpoint. */
function TeacherCard({
  teacher,
  locale,
  labels,
  onDemote,
}: {
  teacher: TeacherView;
  locale: string;
  labels: {
    email: string;
    added: string;
    rowActions: string;
    demote: string;
    status: TeacherStatusLabels;
  };
  onDemote: (teacher: TeacherView) => void;
}) {
  return (
    <Card className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">{teacher.fullName || "—"}</p>
        <p dir="ltr" className="truncate text-sm text-muted-foreground">
          <span className="sr-only">{labels.email}: </span>
          {teacher.email ?? "—"}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center">
            <span className="sr-only">{labels.status.header}: </span>
            <TeacherStatusBadge status={teacher.status} labels={labels.status} />
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="sr-only">{labels.added}: </span>
            {formatDate(teacher.createdAt, locale)}
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
          <DropdownMenuItem
            className="text-destructive-text focus:text-destructive-text"
            onSelect={() => onDemote(teacher)}
          >
            {labels.demote}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
