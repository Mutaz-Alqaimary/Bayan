"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DeletePassageDialog } from "@/features/reading/components/delete-passage-dialog";
import { PassageFormDialog } from "@/features/reading/components/passage-form-dialog";
import { PassagesTable } from "@/features/reading/components/passages-table";
import type { ReadingPassageRecord } from "@/features/reading/types";

/**
 * Client shell for the passages library. Owns the create/edit/delete dialog
 * state and wires the table's row actions to those dialogs. The passages are
 * fetched on the server and passed in.
 */
export function PassagesPage({
  passages,
}: {
  passages: ReadingPassageRecord[];
}) {
  const t = useTranslations("passages");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReadingPassageRecord | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ReadingPassageRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(passage: ReadingPassageRecord) {
    setEditing(passage);
    setFormOpen(true);
  }

  function openDelete(passage: ReadingPassageRecord) {
    setDeleteTarget(passage);
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
          <Plus className="size-4" aria-hidden="true" />
          {t("addPassage")}
        </Button>
      </header>

      <PassagesTable
        passages={passages}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <PassageFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        passage={editing}
      />
      <DeletePassageDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        passage={deleteTarget}
      />
    </div>
  );
}
