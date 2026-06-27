"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  makeNameCollator,
  normalizeForSearch,
} from "@/features/students/data/collation";
import type { StudentAccountStatus } from "@/features/students/identity/types";
import {
  studentDisplayName,
  type StudentRecord,
} from "@/features/students/types";
import { formatDate, formatNumber } from "@/lib/format";

export type StudentStatusLabels = {
  header: string;
  roster_only: string;
  invited: string;
  active: string;
};

export type StudentColumnLabels = {
  name: string;
  studentNumber: string;
  grade: string;
  email: string;
  createdAt: string;
  actions: string;
  edit: string;
  delete: string;
  activationLink: string;
  rowActions: string;
  sortAsc: string;
  sortDesc: string;
  status: StudentStatusLabels;
};

type ColumnContext = {
  locale: string;
  labels: StudentColumnLabels;
  statuses: Record<string, StudentAccountStatus>;
  onEdit: (student: StudentRecord) => void;
  onDelete: (student: StudentRecord) => void;
  onActivate: (student: StudentRecord) => void;
};

/** The badge variant for each derived account status. */
const STATUS_VARIANT: Record<
  StudentAccountStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  invited: "secondary",
  roster_only: "outline",
};

/**
 * Per-status class overrides. `roster_only` (the most common, unclaimed state)
 * gets a filled muted treatment so it stays legible in dark mode — a bare
 * outline badge nearly vanishes against the card there.
 */
const STATUS_CLASS: Record<StudentAccountStatus, string> = {
  active: "",
  invited: "",
  roster_only: "border-transparent bg-muted text-muted-foreground",
};

/** A small badge for a roster row's derived account status. */
export function StudentStatusBadge({
  status,
  labels,
}: {
  status: StudentAccountStatus;
  labels: StudentStatusLabels;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={STATUS_CLASS[status]}>
      {labels[status]}
    </Badge>
  );
}

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

/** A column's sortable header, wired to the shared `SortableHeader`. */
function sortHeader(label: string, labels: StudentColumnLabels) {
  return function Header({
    column,
  }: {
    column: Column<StudentRecord, unknown>;
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

export function buildStudentColumns({
  locale,
  labels,
  statuses,
  onEdit,
  onDelete,
  onActivate,
}: ColumnContext): ColumnDef<StudentRecord>[] {
  const collator = makeNameCollator(locale);

  return [
    {
      id: "name",
      accessorFn: (student) => studentDisplayName(student, locale),
      enableGlobalFilter: true,
      filterFn: studentGlobalFilter,
      header: sortHeader(labels.name, labels),
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
      header: sortHeader(labels.studentNumber, labels),
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
      header: sortHeader(labels.grade, labels),
      cell: ({ row }) => formatNumber(row.original.grade, locale),
    },
    {
      accessorKey: "email",
      enableGlobalFilter: false,
      header: sortHeader(labels.email, labels),
      cell: ({ row }) => (
        <span dir="ltr" className="block max-w-48 truncate text-muted-foreground">
          {row.original.email}
        </span>
      ),
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
      id: "status",
      enableGlobalFilter: false,
      enableSorting: false,
      header: () => labels.status.header,
      cell: ({ row }) => (
        <StudentStatusBadge
          status={statuses[row.original.id] ?? "roster_only"}
          labels={labels.status}
        />
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
                <DropdownMenuItem onSelect={() => onActivate(student)}>
                  {labels.activationLink}
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
