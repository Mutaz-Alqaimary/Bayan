"use client";

import { Upload, UserPlus, Users2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DeleteStudentDialog } from "@/features/students/components/delete-student-dialog";
import { StudentFormDialog } from "@/features/students/components/student-form-dialog";
import { StudentsTable } from "@/features/students/components/students-table";
import { ActivationLinkDialog } from "@/features/students/identity/components/activation-link-dialog";
import { ReconcileDialog } from "@/features/students/identity/components/reconcile-dialog";
import type { StudentAccountStatus } from "@/features/students/identity/types";
import { ExportMenu } from "@/features/students/import-export/components/export-menu";
import { ImportDialog } from "@/features/students/import-export/components/import-dialog";
import type { StudentRecord } from "@/features/students/types";

/**
 * Client shell for the students roster. Owns the create/edit/delete/activation
 * dialog state and wires the table's row actions to those dialogs. The roster
 * and each row's derived account status are fetched on the server and passed in.
 */
export function StudentsPage({
  students,
  statuses,
  teacherProfileIds,
  canReconcile,
}: {
  students: StudentRecord[];
  statuses: Record<string, StudentAccountStatus>;
  teacherProfileIds: string[];
  canReconcile: boolean;
}) {
  const t = useTranslations("students");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [activateTarget, setActivateTarget] = useState<StudentRecord | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(student: StudentRecord) {
    setEditing(student);
    setFormOpen(true);
  }

  function openDelete(student: StudentRecord) {
    setDeleteTarget(student);
    setDeleteOpen(true);
  }

  function openActivate(student: StudentRecord) {
    setActivateTarget(student);
    setActivateOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canReconcile ? (
            <Button variant="outline" onClick={() => setReconcileOpen(true)}>
              <Users2 className="size-4" aria-hidden="true" />
              {t("identity.reconcile.action")}
            </Button>
          ) : null}
          <ExportMenu students={students} />
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" aria-hidden="true" />
            {t("importExport.import")}
          </Button>
          <Button onClick={openCreate}>
            <UserPlus className="size-4" aria-hidden="true" />
            {t("addStudent")}
          </Button>
        </div>
      </header>

      <StudentsTable
        students={students}
        statuses={statuses}
        teacherProfileIds={teacherProfileIds}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={openDelete}
        onActivate={openActivate}
      />

      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editing}
      />
      <DeleteStudentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        student={deleteTarget}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        students={students}
      />
      <ActivationLinkDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        student={activateTarget}
      />
      {canReconcile ? (
        <ReconcileDialog open={reconcileOpen} onOpenChange={setReconcileOpen} />
      ) : null}
    </div>
  );
}
