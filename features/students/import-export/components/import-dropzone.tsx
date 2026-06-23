"use client";

import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { downloadStudentTemplate } from "@/features/students/import-export/template";
import type { StudentImportParseError } from "@/features/students/import-export/types";
import { cn } from "@/lib/utils";

const ACCEPT = ".csv,.xlsx";

/**
 * Upload step of the import wizard. Drag-and-drop is an enhancement over a
 * fully keyboard-accessible file input (the label is the focusable control).
 * Parse errors are surfaced inline with recovery guidance; the template is
 * always downloadable from here.
 */
export function ImportDropzone({
  onFile,
  parsing,
  parseError,
}: {
  onFile: (file: File) => void;
  parsing: boolean;
  parseError: StudentImportParseError | null;
}) {
  const t = useTranslations("students.importExport.upload");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function submit(file: File | undefined) {
    if (!file) return;
    onFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (parsing) return;
    submit(event.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!parsing) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card/40",
          parsing && "pointer-events-none opacity-70",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          {parsing ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <UploadCloud className="size-6" />
          )}
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {parsing ? t("parsing") : t("title")}
          </p>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={parsing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Reset so re-selecting the same file still fires onChange.
            event.target.value = "";
            submit(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={parsing}
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          {t("choose")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("accepted")}</p>
      </div>

      {parseError ? (
        <ErrorState
          title={t(`errors.${parseError}.title`)}
          description={t(`errors.${parseError}.description`)}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0 text-sm text-muted-foreground">
        <span>{t("templateHint")}</span>
        <Button
          type="button"
          variant="link"
          className="h-auto px-1 py-0"
          onClick={() => downloadStudentTemplate("xlsx")}
        >
          {t("templateXlsx")}
        </Button>
        <span aria-hidden="true">·</span>
        <Button
          type="button"
          variant="link"
          className="h-auto px-1 py-0"
          onClick={() => downloadStudentTemplate("csv")}
        >
          {t("templateCsv")}
        </Button>
      </div>
    </div>
  );
}
