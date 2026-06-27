import { USER_ROLES, type UserRole } from "@/features/auth/types";

/**
 * Role and capability helpers. These encode the minimum-permissions matrix from
 * `.claude/rules/architecture.md` in one place so UI gating and data-layer
 * gating stay consistent. Pure functions — safe to use on server or client.
 */

/** Runtime guard for an untrusted role value (e.g. a DB/string value). */
export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isTeacher(role: UserRole): boolean {
  return role === "teacher";
}

export function isStudent(role: UserRole): boolean {
  return role === "student";
}

/** Full platform access and user management (admin only). */
export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

/** Manage students (admin, teacher). */
export function canManageStudents(role: UserRole): boolean {
  return role === "admin" || role === "teacher";
}

/** Manage reading content — passages and vocabulary (admin, teacher). */
export function canManageContent(role: UserRole): boolean {
  return role === "admin" || role === "teacher";
}

/** Access reading analytics (admin, teacher). */
export function canAccessAnalytics(role: UserRole): boolean {
  return role === "admin" || role === "teacher";
}

/** Access reporting (admin, teacher). */
export function canAccessReports(role: UserRole): boolean {
  return role === "admin" || role === "teacher";
}

/**
 * Manage teacher accounts & role changes (admin only) — Phase 12.6.
 *
 * Deliberately distinct from `canManageUsers` (also admin) so the Teacher
 * Management surface reads self-documenting and can diverge from any future,
 * broader user-management area without churn.
 */
export function canManageTeachers(role: UserRole): boolean {
  return role === "admin";
}

/**
 * The roles a role change may move **between**. `admin` is intentionally
 * excluded: admin accounts are infrastructure-only — never created, assigned, or
 * removed through the application (Phase 12.6).
 */
export const MANAGEABLE_ROLES = ["student", "teacher"] as const;

/** A role that can be the source or destination of an in-app role change. */
export type ManageableRole = (typeof MANAGEABLE_ROLES)[number];

function isManageableRole(role: UserRole): role is ManageableRole {
  return (MANAGEABLE_ROLES as readonly string[]).includes(role);
}

/**
 * The single source of truth for whether a role change is allowed, used by both
 * the UI (to enable/disable) and the server action (to authorize). Encodes the
 * Phase 12.6 invariants:
 * - only an **admin** may change roles;
 * - never to or from **admin** (infrastructure-only);
 * - never the actor's **own** role (no self-promotion/-demotion/-lockout);
 * - it must be an actual change (`student` ⇄ `teacher`).
 */
export function canChangeRole(params: {
  actorRole: UserRole;
  targetCurrentRole: UserRole;
  targetNewRole: UserRole;
  isSelf: boolean;
}): boolean {
  const { actorRole, targetCurrentRole, targetNewRole, isSelf } = params;
  if (actorRole !== "admin") return false;
  if (isSelf) return false;
  if (!isManageableRole(targetCurrentRole)) return false;
  if (!isManageableRole(targetNewRole)) return false;
  return targetCurrentRole !== targetNewRole;
}
