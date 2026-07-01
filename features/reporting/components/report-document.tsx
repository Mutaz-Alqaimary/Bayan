import type { Report } from "../types";
import { CohortReportBody } from "./cohort-report-body";
import { StudentReportBody } from "./student-report-body";

/**
 * The printable report document — the part that becomes the PDF. Dispatches to
 * the cohort or student body by `kind`; each body carries its own printed header
 * (the single `<h1>`) and content. `data-report-print-root` marks this subtree
 * as the sole printable region: the scoped `@media print` rules in `globals.css`
 * key off it to isolate the document (hiding the shell + toolbar) — so the print
 * styles never affect any other page.
 */
export function ReportDocument({ report }: { report: Report }) {
  return (
    <article data-report-print-root className="space-y-6">
      {report.kind === "cohort" ? (
        <CohortReportBody report={report} />
      ) : (
        <StudentReportBody report={report} />
      )}
    </article>
  );
}
