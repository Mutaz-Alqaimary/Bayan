import type { PickerStudent } from "@/features/analytics/components/student-picker";
import type { TimeRange } from "@/features/analytics/time-range";

import type { Report } from "../types";
import { ReportDocument } from "./report-document";
import { ReportToolbar } from "./report-toolbar";

/**
 * The `/reports` shell (admin + teacher): the on-screen "report builder" toolbar
 * (range + scope + print) followed by the printable document. All state (range +
 * drilled-in student) lives in the URL, so this is a Server Component with no
 * client state — mirroring `/analytics`. The single `<h1>` comes from the
 * document's own header; the toolbar is excluded from the printout.
 */
export function ReportPage({
  report,
  range,
  studentId,
}: {
  report: Report;
  range: TimeRange;
  studentId: string | null;
}) {
  // The cohort-view picker needs the roster; only available when the cohort
  // report resolved with data. Student view shows a back link instead of a picker.
  const pickerStudents: PickerStudent[] =
    report.kind === "cohort" && report.analytics.availability === "ready"
      ? report.analytics.students.map((student) => ({
          id: student.id,
          name: student.name,
        }))
      : [];

  return (
    <div className="space-y-6">
      <ReportToolbar
        kind={report.kind}
        range={range}
        studentId={studentId}
        students={pickerStudents}
      />
      <ReportDocument report={report} />
    </div>
  );
}
