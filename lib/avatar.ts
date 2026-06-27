import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Avatar storage helpers (Phase 12.6, Part 1).
 *
 * Framework-agnostic (no React, no Supabase client) so they can be used from the
 * client uploader, the server action, and any render that shows an avatar.
 *
 * `profiles.avatar_url` stores the **bucket-qualified object path**
 * (`avatars/{user_id}/avatar.webp`) — never a full public/CDN URL — so the
 * database is independent of the bucket's public base, CDN, or domain, and can
 * move to signed URLs later without touching stored data. The display URL is
 * generated at runtime from the stored path (see `avatarPublicUrl`).
 *
 * The path is **stable** per user (`avatar.webp`), so replacing an avatar is an
 * overwrite (`upsert`) and never leaves an orphaned object.
 */

export const AVATAR_BUCKET = "avatars";

/** Max stored avatar size — mirrors the bucket `file_size_limit` (1 MB). */
export const AVATAR_MAX_BYTES = 1024 * 1024;

/** Longest edge the client downscales to before encoding (keeps avatars small). */
export const AVATAR_MAX_DIMENSION = 512;

/** Source types the uploader accepts; mirrors the bucket `allowed_mime_types`. */
export const AVATAR_ACCEPTED_TYPES = [
  "image/webp",
  "image/png",
  "image/jpeg",
] as const;

/** The single, stable object file name stored per user. */
const AVATAR_FILE_NAME = "avatar.webp";

/** In-bucket object key for a user's avatar (used with `storage.from(AVATAR_BUCKET)`). */
export function avatarStorageKey(userId: string): string {
  return `${userId}/${AVATAR_FILE_NAME}`;
}

/** The value persisted in `profiles.avatar_url` — the bucket-qualified path. */
export function avatarObjectPath(userId: string): string {
  return `${AVATAR_BUCKET}/${avatarStorageKey(userId)}`;
}

/**
 * Runtime public URL for a stored object path (the `avatars` bucket is public).
 * `version` (e.g. `profiles.updated_at`) is appended as a cache-buster so a
 * replaced avatar at the same stable path is not served stale from the CDN.
 */
export function avatarPublicUrl(
  objectPath: string,
  version?: string | null,
): string {
  const base = `${SUPABASE_URL}/storage/v1/object/public/${objectPath}`;
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}

/** Whether a source file is an accepted avatar image type. */
export function isAcceptedAvatarType(type: string): boolean {
  return (AVATAR_ACCEPTED_TYPES as readonly string[]).includes(type);
}

/**
 * Server-side guard for the received avatar object: the upload path is always
 * `avatar.webp`, so the blob must already be WebP (the client converts), and it
 * must be within the size limit. Returns the failing rule or `null` if valid.
 */
export function validateWebpUpload(file: {
  type: string;
  size: number;
}): "type" | "size" | null {
  if (file.type !== "image/webp") return "type";
  if (file.size > AVATAR_MAX_BYTES) return "size";
  return null;
}
