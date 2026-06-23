"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "@/components/ui/use-toast";
import {
  classifyStudentImport,
  toExistingSnapshot,
} from "@/features/students/import-export/classify";
import { commitStudentImportAction } from "@/features/students/import-export/actions";
import { ImportDropzone } from "@/features/students/import-export/components/import-dropzone";
import { ImportPreview } from "@/features/students/import-export/components/import-preview";
import { parseStudentImportFile } from "@/features/students/import-export/parse";
import { useStudentImportMessages } from "@/features/students/import-export/use-student-import-messages";
import type {
  RawStudentImportRow,
  StudentImportParseError,
  StudentImportPreview,
  StudentImportRowOutcome,
} from "@/features/students/import-export/types";
import { useStudentSchemaMessages } from "@/features/students/components/use-student-schema-messages";
import type { StudentRecord } from "@/features/students/types";
import { useRouter } from "@/i18n/navigation";

type Step = "upload" | "preview" | "result";

type CommitOutcome =
  | { ok: true; created: number; updated: number }
  | {
      ok: false;
      error: { title: string; description: string };
      rejects?: StudentImportRowOutcome[];
    };

/** Build a single-bucket preview from a list of rejected rows (for re-display). */
function rejectsPreview(
  rejects: StudentImportRowOutcome[],
): StudentImportPreview {
  return {
    outcomes: rejects,
    counts: {
      create: 0,
      update: 0,
      skip: 0,
      reject: rejects.length,
      total: rejects.length,
    },
  };
}

/**
 * The bulk-import wizard: upload → preview (create/update/skip/reject) → commit.
 * Parsing and classification run on the client for an instant preview; the
 * commit re-validates server-side and writes atomically. Nothing is written
 * until the user confirms in the preview step.
 */
export function ImportDialog({
  open,
  onOpenChange,
  students,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentRecord[];
}) {
  const t = useTranslations("students.importExport");
  const schemaMessages = useStudentSchemaMessages();
  const importMessages = useStudentImportMessages();
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<StudentImportParseError | null>(
    null,
  );
  const [preview, setPreview] = useState<StudentImportPreview | null>(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<CommitOutcome | null>(null);

  // Reset to a clean upload step whenever the dialog transitions to open. This
  // is the render-time "adjust state on prop change" pattern (no effect, no
  // cascading renders) — see react.dev "You Might Not Need an Effect".
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep("upload");
      setParsing(false);
      setParseError(null);
      setPreview(null);
      setCommitting(false);
      setResult(null);
    }
  }

  async function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    const parsed = await parseStudentImportFile(file);
    if (!parsed.ok) {
      setParseError(parsed.error);
      setParsing(false);
      return;
    }
    setPreview(
      classifyStudentImport({
        rows: parsed.rows,
        existing: students.map(toExistingSnapshot),
        schemaMessages,
        importMessages,
      }),
    );
    setParsing(false);
    setStep("preview");
  }

  const writableCount = preview
    ? preview.counts.create + preview.counts.update
    : 0;

  async function handleCommit() {
    if (!preview) return;
    const committable: RawStudentImportRow[] = preview.outcomes
      .filter(
        (outcome) =>
          outcome.classification === "create" ||
          outcome.classification === "update",
      )
      .map((outcome) => ({ rowNumber: outcome.rowNumber, values: outcome.values }));

    setCommitting(true);
    const response = await commitStudentImportAction(committable);
    setCommitting(false);

    if (response.ok) {
      toast({
        title: t("toasts.successTitle"),
        description: t("toasts.successDescription", {
          created: response.created,
          updated: response.updated,
        }),
      });
      setResult(response);
      setStep("result");
      router.refresh();
      return;
    }

    toast({
      variant: "destructive",
      title: response.error.title,
      description: response.error.description,
    });
    setResult(response);
    setStep("result");
  }

  function backToUpload() {
    setStep("upload");
    setPreview(null);
    setParseError(null);
    setResult(null);
  }

  // Move focus into the new step's region when advancing past upload, so a
  // keyboard/screen-reader user lands on the fresh content rather than a button
  // that no longer exists. (Effect does no setState — no cascading renders.)
  const regionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step === "preview" || step === "result") {
      regionRef.current?.focus();
    }
  }, [step]);

  // A single polite live region announces async transitions (parsing, commit
  // result) and the busy state — covers WCAG 4.1.3 without per-node wiring.
  const statusMessage = parsing
    ? t("upload.parsing")
    : committing
      ? t("preview.committing")
      : step === "result" && result
        ? result.ok
          ? t("result.successDescription", {
              created: result.created,
              updated: result.updated,
            })
          : result.error.title
        : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {step === "preview"
              ? t("preview.summary", {
                  create: preview?.counts.create ?? 0,
                  update: preview?.counts.update ?? 0,
                  skip: preview?.counts.skip ?? 0,
                  reject: preview?.counts.reject ?? 0,
                })
              : t("description")}
          </DialogDescription>
        </DialogHeader>

        <p role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </p>

        <div ref={regionRef} tabIndex={-1} className="focus-visible:outline-none">
        {step === "upload" ? (
          <ImportDropzone
            onFile={handleFile}
            parsing={parsing}
            parseError={parseError}
          />
        ) : null}

        {step === "preview" && preview ? (
          <ImportPreview preview={preview} />
        ) : null}

        {step === "result" && result ? (
          result.ok ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:size-6">
                <CheckCircle2 aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  {t("result.successTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("result.successDescription", {
                    created: result.created,
                    updated: result.updated,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ErrorState
                title={result.error.title}
                description={result.error.description}
              />
              {result.rejects && result.rejects.length > 0 ? (
                <ImportPreview preview={rejectsPreview(result.rejects)} />
              ) : null}
            </div>
          )
        ) : null}
        </div>

        <DialogFooter>
          {step === "preview" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={backToUpload}
                disabled={committing}
              >
                {t("preview.chooseAnother")}
              </Button>
              <Button
                type="button"
                onClick={handleCommit}
                disabled={committing || writableCount === 0}
                aria-busy={committing}
              >
                {committing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("preview.committing")}
                  </>
                ) : (
                  t("preview.commit", { count: writableCount })
                )}
              </Button>
            </>
          ) : step === "result" && result && !result.ok ? (
            <>
              <Button type="button" variant="outline" onClick={backToUpload}>
                {t("result.tryAgain")}
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                {t("result.close")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant={step === "result" ? "default" : "outline"}
              onClick={() => onOpenChange(false)}
            >
              {step === "result" ? t("result.done") : t("cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
