"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DeleteStudentDialog } from "@/features/students/components/delete-student-dialog";
import { StudentFormDialog } from "@/features/students/components/student-form-dialog";
import { StudentsTable } from "@/features/students/components/students-table";
import type { StudentRecord } from "@/features/students/types";

/**
 * Client shell for the students roster. Owns the create/edit/delete dialog state
 * and wires the table's row actions to those dialogs. The roster itself is
 * fetched on the server and passed in as `students`.
 */
export function StudentsPage({ students }: { students: StudentRecord[] }) {
  const t = useTranslations("students");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="size-4" aria-hidden="true" />
          {t("addStudent")}
        </Button>
      </header>

      <StudentsTable
        students={students}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={openDelete}
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
    </div>
  );
}
