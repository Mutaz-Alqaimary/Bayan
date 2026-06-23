"use client";

import { BookOpenText, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteVocabularyDialog } from "@/features/reading/components/delete-vocabulary-dialog";
import { VocabularyFormDialog } from "@/features/reading/components/vocabulary-form-dialog";
import { VocabularyTable } from "@/features/reading/components/vocabulary-table";
import type {
  PassageOption,
  VocabularyTermRecord,
} from "@/features/reading/types";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

/**
 * Client shell for the global vocabulary list. Owns the create/edit/delete
 * dialog state. Terms are always scoped to a passage, so when no passages exist
 * yet it guides the user to create one first (a term can't be added without a
 * passage to attach it to).
 */
export function VocabularyPage({
  terms,
  passages,
}: {
  terms: VocabularyTermRecord[];
  passages: PassageOption[];
}) {
  const t = useTranslations("vocabulary");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VocabularyTermRecord | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<VocabularyTermRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(term: VocabularyTermRecord) {
    setEditing(term);
    setFormOpen(true);
  }

  function openDelete(term: VocabularyTermRecord) {
    setDeleteTarget(term);
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
        {passages.length > 0 ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            {t("addTerm")}
          </Button>
        ) : null}
      </header>

      {passages.length === 0 ? (
        <EmptyState
          icon={<BookOpenText />}
          title={t("noPassages.title")}
          description={t("noPassages.description")}
          action={
            <Button asChild>
              <Link href={ROUTES.passages}>{t("noPassages.action")}</Link>
            </Button>
          }
        />
      ) : (
        <VocabularyTable
          terms={terms}
          passages={passages}
          onAdd={openCreate}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      <VocabularyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        term={editing}
        passages={passages}
      />
      <DeleteVocabularyDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        term={deleteTarget}
      />
    </div>
  );
}
