"use client";

import { Copy, Link2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { generateStudentActivationLinkAction } from "@/features/students/identity/actions";
import { studentDisplayName, type StudentRecord } from "@/features/students/types";
import { useLocale } from "next-intl";

type LinkState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error" };

/**
 * Admin/teacher activation-link dialog (Phase 12.5). Generates a no-SMTP
 * Supabase action link the admin copies and shares; the student opens it to set
 * a password and activate their account. The link is generated on demand (button
 * click), never automatically, and shown read-only with a copy control.
 */
export function ActivationLinkDialog({
  student,
  open,
  onOpenChange,
}: {
  student: StudentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("students.identity.activation");
  const locale = useLocale();
  const [state, setState] = useState<LinkState>({ status: "idle" });

  function handleOpenChange(next: boolean) {
    if (!next) setState({ status: "idle" }); // reset for the next student
    onOpenChange(next);
  }

  async function generate() {
    if (!student) return;
    setState({ status: "loading" });
    const result = await generateStudentActivationLinkAction(student.id);
    if (!result.ok) {
      setState({ status: "error" });
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }
    setState({ status: "ready", url: result.url });
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("copied") });
    } catch {
      toast({ variant: "destructive", title: t("copyFailed") });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {student
              ? t("description", { name: studentDisplayName(student, locale) })
              : null}
          </DialogDescription>
        </DialogHeader>

        <div aria-live="polite">
        {state.status === "ready" ? (
          <div className="space-y-2">
            <Label htmlFor="activation-link-url">{t("linkLabel")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="activation-link-url"
                readOnly
                dir="ltr"
                value={state.url}
                className="font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copy(state.url)}
                aria-label={t("copy")}
              >
                <Copy className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("hint")}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("intro")}</p>
        )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={generate}
            disabled={state.status === "loading"}
            aria-busy={state.status === "loading"}
          >
            {state.status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("generating")}
              </>
            ) : (
              <>
                <Link2 className="size-4" aria-hidden="true" />
                {state.status === "ready" ? t("regenerate") : t("generate")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
