"use client";

import { ImageUp, Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "@/i18n/navigation";
import {
  removeAvatarAction,
  updateAvatarAction,
} from "@/features/settings/profile-actions";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_DIMENSION,
  isAcceptedAvatarType,
} from "@/lib/avatar";

/** Two-letter initials for the no-avatar fallback. */
function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type Prepared = { blob: Blob } | { error: "type" | "size" | "decode" };

/**
 * Convert a JPEG/PNG to a downscaled WebP `Blob` via canvas (no dependency).
 * WebP inputs are passed through unchanged (owner decision: already-WebP uploads
 * directly; only JPEG/PNG are converted).
 */
async function prepareAvatar(file: File): Promise<Prepared> {
  if (!isAcceptedAvatarType(file.type)) return { error: "type" };

  if (file.type === "image/webp") {
    return file.size > AVATAR_MAX_BYTES ? { error: "size" } : { blob: file };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      AVATAR_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { error: "decode" };
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.9),
    );
    if (!blob) return { error: "decode" };
    return blob.size > AVATAR_MAX_BYTES ? { error: "size" } : { blob };
  } catch {
    return { error: "decode" };
  }
}

/**
 * Avatar upload control (Phase 12.6, Part 1): pick → validate → WebP
 * passthrough/convert → preview → save (transactional server action) → remove.
 * Profile data is only written after a successful upload; the server compensates
 * (deletes the object) if the DB write fails, so Storage and the DB never
 * diverge. The display URL is generated at runtime from the stored object path.
 */
export function AvatarUploader({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const t = useTranslations("settings.profile.avatar");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const shownUrl = preview?.url ?? avatarUrl;

  function clearPreview() {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (!file) return;

    const prepared = await prepareAvatar(file);
    if ("error" in prepared) {
      const key =
        prepared.error === "size"
          ? "imageTooLarge"
          : prepared.error === "decode"
            ? "decodeFailed"
            : "invalidImage";
      toast({
        variant: "destructive",
        title: t(`errors.${key}.title`),
        description: t(`errors.${key}.description`),
      });
      return;
    }

    clearPreview();
    setPreview({ url: URL.createObjectURL(prepared.blob), blob: prepared.blob });
  }

  async function onSave() {
    if (!preview) return;
    setBusy(true);
    const formData = new FormData();
    formData.append("file", preview.blob, "avatar.webp");
    const result = await updateAvatarAction(formData);
    setBusy(false);

    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }

    toast({ title: t("toasts.updated") });
    clearPreview();
    router.refresh();
  }

  async function onRemove() {
    setBusy(true);
    const result = await removeAvatarAction();
    setBusy(false);

    if (!result.ok) {
      toast({
        variant: "destructive",
        title: result.error.title,
        description: result.error.description,
      });
      return;
    }

    toast({ title: t("toasts.removed") });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary">
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime public URL from a stored path; not a build-time asset
          <img
            src={shownUrl}
            alt={t("imageAlt", { name: displayName })}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initials(displayName)}</span>
        )}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={onFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {preview ? (
          <>
            <Button type="button" onClick={onSave} disabled={busy} aria-busy={busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t("save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearPreview}
              disabled={busy}
            >
              <X className="size-4" aria-hidden="true" />
              {t("cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <ImageUp className="size-4" aria-hidden="true" />
              {avatarUrl ? t("replace") : t("upload")}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onRemove}
                disabled={busy}
                aria-busy={busy}
                className="text-destructive-text hover:text-destructive-text"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                {t("remove")}
              </Button>
            ) : null}
          </>
        )}
        <p className="w-full text-xs text-muted-foreground">{t("hint")}</p>
      </div>
    </div>
  );
}
