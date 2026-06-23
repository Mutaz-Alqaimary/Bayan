"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StudentImportField } from "@/features/students/import-export/columns";
import type {
  StudentImportClassification,
  StudentImportPreview,
  StudentImportRowOutcome,
} from "@/features/students/import-export/types";
import { studentDisplayName } from "@/features/students/types";
import { formatNumber } from "@/lib/format";

/** Map a canonical field key to its localized `students.fields` label key. */
const FIELD_LABEL_KEY = {
  student_number: "studentNumber",
  first_name_ar: "firstNameAr",
  last_name_ar: "lastNameAr",
  first_name_en: "firstNameEn",
  last_name_en: "lastNameEn",
  email: "email",
  grade: "grade",
  birth_date: "birthDate",
} as const satisfies Record<StudentImportField, string>;

const TAB_ORDER: StudentImportClassification[] = [
  "create",
  "update",
  "skip",
  "reject",
];

/** A distinct, on-system badge tone per bucket so the tabs triage at a glance. */
const TAB_BADGE_VARIANT: Record<
  StudentImportClassification,
  "default" | "secondary" | "outline" | "destructive"
> = {
  create: "default",
  update: "secondary",
  skip: "outline",
  reject: "destructive",
};

export function ImportPreview({ preview }: { preview: StudentImportPreview }) {
  const t = useTranslations("students.importExport.preview");
  const tFields = useTranslations("students.fields");
  const locale = useLocale();

  const fieldLabel = (field: StudentImportField) =>
    tFields(FIELD_LABEL_KEY[field]);

  const buckets = useMemo(() => {
    return {
      create: preview.outcomes.filter((o) => o.classification === "create"),
      update: preview.outcomes.filter((o) => o.classification === "update"),
      skip: preview.outcomes.filter((o) => o.classification === "skip"),
      reject: preview.outcomes.filter((o) => o.classification === "reject"),
    } satisfies Record<StudentImportClassification, StudentImportRowOutcome[]>;
  }, [preview]);

  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {TAB_ORDER.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="gap-1.5 text-xs sm:text-sm">
            <span>{t(`tabs.${tab}`)}</span>
            <Badge
              variant={
                buckets[tab].length === 0 ? "outline" : TAB_BADGE_VARIANT[tab]
              }
              className="tabular-nums"
            >
              {formatNumber(buckets[tab].length, locale)}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {TAB_ORDER.map((tab) => (
        <TabsContent key={tab} value={tab}>
          <div
            tabIndex={0}
            role="region"
            aria-label={t(`tabs.${tab}`)}
            className="max-h-88 space-y-2 overflow-y-auto pe-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {buckets[tab].length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t(`empty.${tab}`)}
              </p>
            ) : (
              <ul className="space-y-2">
                {buckets[tab].map((outcome) => (
                  <li key={outcome.rowNumber}>
                    <OutcomeRow
                      outcome={outcome}
                      locale={locale}
                      rowLabel={t("row", {
                        number: formatNumber(outcome.rowNumber, locale),
                      })}
                      noChangesLabel={t("noChanges")}
                      fromLabel={t("changeFrom")}
                      toLabel={t("changeTo")}
                      errorLabel={t("errorLabel")}
                      fieldLabel={fieldLabel}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function OutcomeRow({
  outcome,
  locale,
  rowLabel,
  noChangesLabel,
  fromLabel,
  toLabel,
  errorLabel,
  fieldLabel,
}: {
  outcome: StudentImportRowOutcome;
  locale: string;
  rowLabel: string;
  noChangesLabel: string;
  fromLabel: string;
  toLabel: string;
  errorLabel: string;
  fieldLabel: (field: StudentImportField) => string;
}) {
  const name = studentDisplayName(outcome.values, locale);
  const isReject = outcome.classification === "reject";

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="tabular-nums">
          {rowLabel}
        </Badge>
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {name.trim() || "—"}
        </span>
        <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">
          {outcome.values.student_number || "—"}
        </span>
        <span dir="ltr" className="truncate text-xs text-muted-foreground">
          {outcome.values.email || "—"}
        </span>
      </div>

      {outcome.classification === "update" ? (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {outcome.changes.map((change) => (
            <li key={change.field} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {fieldLabel(change.field)}:
              </span>{" "}
              <span className="sr-only">{fromLabel} </span>
              <span dir="auto" className="line-through">
                {change.before || "—"}
              </span>{" "}
              {/* Decorative connector; flips with direction. Screen readers
                  hear the "from … to …" labels instead. */}
              <ArrowRight
                className="inline size-3 align-middle rtl:rotate-180"
                aria-hidden="true"
              />{" "}
              <span className="sr-only">{toLabel} </span>
              <span dir="auto" className="text-foreground">
                {change.after || "—"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {outcome.classification === "skip" ? (
        <p className="mt-1 text-xs text-muted-foreground">{noChangesLabel}</p>
      ) : null}

      {isReject ? (
        <ul className="mt-2 space-y-1 border-t border-destructive/20 pt-2">
          {outcome.errors.map((error) => (
            <li
              key={`${error.field}-${error.message}`}
              className="text-xs text-destructive-text"
            >
              <span className="sr-only">{errorLabel}: </span>
              <span className="font-medium">{fieldLabel(error.field)}:</span>{" "}
              {error.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
