"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  makeNameCollator,
  normalizeForSearch,
} from "@/features/students/data/collation";
import {
  studentDisplayName,
  type StudentRecord,
} from "@/features/students/types";
import { formatDate, formatNumber } from "@/lib/format";

export type StudentColumnLabels = {
  name: string;
  studentNumber: string;
  grade: string;
  email: string;
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
  labels: StudentColumnLabels;
  onEdit: (student: StudentRecord) => void;
  onDelete: (student: StudentRecord) => void;
};

/**
 * Forgiving, Arabic-aware global search across name (ar + en), student number,
 * email, and grade. Enabled on a single column so it runs once per row.
 */
export const studentGlobalFilter: FilterFn<StudentRecord> = (
  row,
  _columnId,
  filterValue,
) => {
  const query = normalizeForSearch(String(filterValue ?? ""));
  if (!query) return true;
  const s = row.original;
  const haystack = normalizeForSearch(
    [
      s.first_name_ar,
      s.last_name_ar,
      s.first_name_en ?? "",
      s.last_name_en ?? "",
      s.student_number,
      s.email,
      String(s.grade),
    ].join(" "),
  );
  return haystack.includes(query);
};

/** A sortable column header rendered as a real button with a direction icon. */
function SortHeader({
  column,
  label,
  labels,
}: {
  column: Column<StudentRecord, unknown>;
  label: string;
  labels: StudentColumnLabels;
}) {
  const sorted = column.getIsSorted();
  const nextLabel = sorted === "asc" ? labels.sortDesc : labels.sortAsc;
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
      // The visible label is the accessible name; current sort state is conveyed
      // by `aria-sort` on the parent <th>. `title` advertises the next action to
      // sighted users without overriding the name (avoids a state/action clash).
      title={nextLabel}
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

export function buildStudentColumns({
  locale,
  labels,
  onEdit,
  onDelete,
}: ColumnContext): ColumnDef<StudentRecord>[] {
  const collator = makeNameCollator(locale);

  return [
    {
      id: "name",
      accessorFn: (student) => studentDisplayName(student, locale),
      enableGlobalFilter: true,
      filterFn: studentGlobalFilter,
      header: ({ column }) => (
        <SortHeader column={column} label={labels.name} labels={labels} />
      ),
      sortingFn: (rowA, rowB) =>
        collator.compare(
          studentDisplayName(rowA.original, locale),
          studentDisplayName(rowB.original, locale),
        ),
      cell: ({ row }) => {
        const student = row.original;
        const primary = studentDisplayName(student, locale);
        const secondary =
          locale === "en"
            ? `${student.first_name_ar} ${student.last_name_ar}`
            : student.first_name_en && student.last_name_en
              ? `${student.first_name_en} ${student.last_name_en}`
              : null;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{primary}</span>
            {secondary ? (
              <span
                dir={locale === "en" ? "rtl" : "ltr"}
                className="text-xs text-muted-foreground"
              >
                {secondary}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "student_number",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <SortHeader
          column={column}
          label={labels.studentNumber}
          labels={labels}
        />
      ),
      sortingFn: (rowA, rowB) =>
        collator.compare(
          rowA.original.student_number,
          rowB.original.student_number,
        ),
      cell: ({ row }) => (
        <span dir="ltr" className="tabular-nums">
          {row.original.student_number}
        </span>
      ),
    },
    {
      accessorKey: "grade",
      enableGlobalFilter: false,
      filterFn: "equals",
      header: ({ column }) => (
        <SortHeader column={column} label={labels.grade} labels={labels} />
      ),
      cell: ({ row }) => formatNumber(row.original.grade, locale),
    },
    {
      accessorKey: "email",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <SortHeader column={column} label={labels.email} labels={labels} />
      ),
      cell: ({ row }) => (
        <span dir="ltr" className="block max-w-48 truncate text-muted-foreground">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <SortHeader column={column} label={labels.createdAt} labels={labels} />
      ),
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
        const student = row.original;
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
          </div>
        );
      },
    },
  ];
}
