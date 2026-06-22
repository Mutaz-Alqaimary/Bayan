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
  MoreHorizontal,
  Search,
  UserPlus,
  Users,
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
  buildStudentColumns,
  studentGlobalFilter,
} from "@/features/students/components/student-columns";
import {
  studentDisplayName,
  type StudentRecord,
} from "@/features/students/types";
import { formatDate, formatNumber } from "@/lib/format";

const PAGE_SIZE = 10;
const ALL_GRADES = "all";

type StudentsTableProps = {
  students: StudentRecord[];
  onAdd: () => void;
  onEdit: (student: StudentRecord) => void;
  onDelete: (student: StudentRecord) => void;
};

export function StudentsTable({
  students,
  onAdd,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  const t = useTranslations("students");
  const locale = useLocale();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>(ALL_GRADES);

  const labels = useMemo(
    () => ({
      name: t("columns.name"),
      studentNumber: t("columns.studentNumber"),
      grade: t("columns.grade"),
      email: t("columns.email"),
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
    () => buildStudentColumns({ locale, labels, onEdit, onDelete }),
    [locale, labels, onEdit, onDelete],
  );

  const gradeOptions = useMemo(
    () => [...new Set(students.map((s) => s.grade))].sort((a, b) => a - b),
    [students],
  );

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: studentGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  function handleGradeChange(value: string) {
    setGradeFilter(value);
    table
      .getColumn("grade")
      ?.setFilterValue(value === ALL_GRADES ? undefined : Number(value));
  }

  function clearFilters() {
    setGlobalFilter("");
    setGradeFilter(ALL_GRADES);
    table.getColumn("grade")?.setFilterValue(undefined);
  }

  // No roster at all → onboarding empty state (distinct from "no results").
  if (students.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <Button onClick={onAdd}>
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
  const totalCount = students.length;
  const cardLabels = {
    grade: t("card.grade"),
    studentNumber: t("card.studentNumber"),
    email: t("card.email"),
    added: t("card.added"),
    rowActions: t("actions.rowActions"),
    edit: t("actions.edit"),
    delete: t("actions.delete"),
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: search + grade filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Label htmlFor="students-search" className="sr-only">
            {t("toolbar.searchLabel")}
          </Label>
          <Search
            className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="students-search"
            type="search"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={t("toolbar.searchPlaceholder")}
            className="ps-9"
          />
        </div>

        <Select value={gradeFilter} onValueChange={handleGradeChange}>
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label={t("toolbar.gradeLabel")}
          >
            <SelectValue placeholder={t("toolbar.gradeAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GRADES}>{t("toolbar.gradeAll")}</SelectItem>
            {gradeOptions.map((grade) => (
              <SelectItem key={grade} value={String(grade)}>
                {t("toolbar.gradeOption", { grade: formatNumber(grade, locale) })}
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
                <StudentCard
                  student={row.original}
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

/** Compact roster card for the mobile (phone) breakpoint. */
function StudentCard({
  student,
  locale,
  labels,
  onEdit,
  onDelete,
}: {
  student: StudentRecord;
  locale: string;
  labels: {
    grade: string;
    studentNumber: string;
    email: string;
    added: string;
    edit: string;
    delete: string;
    rowActions: string;
  };
  onEdit: (student: StudentRecord) => void;
  onDelete: (student: StudentRecord) => void;
}) {
  const name = studentDisplayName(student, locale);
  return (
    <Card className="flex items-start justify-between gap-3 p-4">
      {/* Each datum carries an sr-only label since the card has no column
          headers to associate with (the desktop table's <th> don't apply here). */}
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-foreground">{name}</p>
        <p dir="ltr" className="truncate text-sm text-muted-foreground">
          <span className="sr-only">{labels.email}: </span>
          {student.email}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">
            {labels.grade} {formatNumber(student.grade, locale)}
          </Badge>
          <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">
            <span className="sr-only">{labels.studentNumber}: </span>
            {student.student_number}
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="sr-only">{labels.added}: </span>
            {formatDate(student.created_at, locale)}
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
          <DropdownMenuItem onSelect={() => onEdit(student)}>
            {labels.edit}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive-text focus:text-destructive-text"
            onSelect={() => onDelete(student)}
          >
            {labels.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
