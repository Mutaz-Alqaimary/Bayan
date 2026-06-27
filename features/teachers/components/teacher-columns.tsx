"use client";

import type { Column, ColumnDef, FilterFn } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  makeNameCollator,
  normalizeForSearch,
} from "@/features/students/data/collation";
import type {
  TeacherAccountStatus,
  TeacherView,
} from "@/features/teachers/types";
import { formatDate } from "@/lib/format";

export type TeacherStatusLabels = {
  header: string;
  invited: string;
  active: string;
};

export type TeacherColumnLabels = {
  name: string;
  email: string;
  createdAt: string;
  actions: string;
  demote: string;
  rowActions: string;
  sortAsc: string;
  sortDesc: string;
  status: TeacherStatusLabels;
};

type ColumnContext = {
  locale: string;
  labels: TeacherColumnLabels;
  onDemote: (teacher: TeacherView) => void;
};

const STATUS_VARIANT: Record<TeacherAccountStatus, "default" | "secondary"> = {
  active: "default",
  invited: "secondary",
};

/** A small badge for a teacher account's derived status. */
export function TeacherStatusBadge({
  status,
  labels,
}: {
  status: TeacherAccountStatus;
  labels: TeacherStatusLabels;
}) {
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}

/** Forgiving, Arabic-aware global search across name + email. */
export const teacherGlobalFilter: FilterFn<TeacherView> = (
  row,
  _columnId,
  filterValue,
) => {
  const query = normalizeForSearch(String(filterValue ?? ""));
  if (!query) return true;
  const t = row.original;
  const haystack = normalizeForSearch([t.fullName, t.email ?? ""].join(" "));
  return haystack.includes(query);
};

function sortHeader(label: string, labels: TeacherColumnLabels) {
  return function Header({ column }: { column: Column<TeacherView, unknown> }) {
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

export function buildTeacherColumns({
  locale,
  labels,
  onDemote,
}: ColumnContext): ColumnDef<TeacherView>[] {
  const collator = makeNameCollator(locale);

  return [
    {
      id: "name",
      accessorFn: (teacher) => teacher.fullName,
      enableGlobalFilter: true,
      filterFn: teacherGlobalFilter,
      header: sortHeader(labels.name, labels),
      sortingFn: (rowA, rowB) =>
        collator.compare(rowA.original.fullName, rowB.original.fullName),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.fullName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      enableGlobalFilter: false,
      header: sortHeader(labels.email, labels),
      cell: ({ row }) => (
        <span dir="ltr" className="block max-w-56 truncate text-muted-foreground">
          {row.original.email ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (teacher) => teacher.status,
      enableGlobalFilter: false,
      enableSorting: false,
      filterFn: "equals",
      header: () => labels.status.header,
      cell: ({ row }) => (
        <TeacherStatusBadge
          status={row.original.status}
          labels={labels.status}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      enableGlobalFilter: false,
      header: sortHeader(labels.createdAt, labels),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.createdAt, locale)}
        </span>
      ),
    },
    {
      id: "actions",
      enableGlobalFilter: false,
      enableSorting: false,
      header: () => <span className="sr-only">{labels.actions}</span>,
      cell: ({ row }) => (
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
              <DropdownMenuItem
                className="text-destructive-text focus:text-destructive-text"
                onSelect={() => onDemote(row.original)}
              >
                {labels.demote}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
