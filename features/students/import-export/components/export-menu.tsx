"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportStudents,
  type StudentExportFormat,
} from "@/features/students/import-export/export";
import { downloadStudentTemplate } from "@/features/students/import-export/template";
import type { StudentRecord } from "@/features/students/types";

/**
 * Export the roster to XLSX/CSV and download the import template. Disabled for
 * export when the roster is empty (nothing to export); the template downloads
 * are always available so a user can prepare their first import.
 */
export function ExportMenu({ students }: { students: StudentRecord[] }) {
  const t = useTranslations("students.importExport");
  const hasStudents = students.length > 0;

  function handleExport(format: StudentExportFormat) {
    exportStudents(students, format);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="size-4" aria-hidden="true" />
          {t("export.trigger")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("export.rosterLabel")}</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={!hasStudents}
          onSelect={() => handleExport("xlsx")}
        >
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          {t("export.xlsx")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!hasStudents}
          onSelect={() => handleExport("csv")}
        >
          <FileText className="size-4" aria-hidden="true" />
          {t("export.csv")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t("export.templateLabel")}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => downloadStudentTemplate("xlsx")}>
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          {t("export.templateXlsx")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadStudentTemplate("csv")}>
          <FileText className="size-4" aria-hidden="true" />
          {t("export.templateCsv")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
