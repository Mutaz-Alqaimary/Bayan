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
