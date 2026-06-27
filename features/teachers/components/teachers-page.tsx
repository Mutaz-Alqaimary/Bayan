"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DemoteTeacherDialog } from "@/features/teachers/components/demote-teacher-dialog";
import { PromoteTeacherDialog } from "@/features/teachers/components/promote-teacher-dialog";
import { TeachersTable } from "@/features/teachers/components/teachers-table";
import type {
  PromotableUserView,
  TeacherView,
} from "@/features/teachers/types";

/**
 * Client shell for Teacher Management (admin only). Owns the promote/demote
 * dialog state and wires the table's row action to the demote confirmation. The
 * teacher list and promotion candidates are fetched on the server and passed in.
 */
export function TeachersPage({
  teachers,
  candidates,
}: {
  teachers: TeacherView[];
  candidates: PromotableUserView[];
}) {
  const t = useTranslations("teachers");
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState<TeacherView | null>(null);
  const [demoteOpen, setDemoteOpen] = useState(false);

  function openDemote(teacher: TeacherView) {
    setDemoteTarget(teacher);
    setDemoteOpen(true);
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
        <Button onClick={() => setPromoteOpen(true)}>
          <UserPlus className="size-4" aria-hidden="true" />
          {t("promoteAction")}
        </Button>
      </header>

      <TeachersTable
        teachers={teachers}
        onPromote={() => setPromoteOpen(true)}
        onDemote={openDemote}
      />

      <PromoteTeacherDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        candidates={candidates}
      />
      <DemoteTeacherDialog
        open={demoteOpen}
        onOpenChange={setDemoteOpen}
        teacher={demoteTarget}
      />
    </div>
  );
}
