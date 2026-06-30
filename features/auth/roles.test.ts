import { describe, expect, it } from "vitest";

import {
  canAccessAnalytics,
  canAccessReports,
  canChangeRole,
  canManageContent,
  canManageStudents,
  canManageTeachers,
  canManageUsers,
  isAdmin,
  isStudent,
  isTeacher,
  isUserRole,
} from "@/features/auth/roles";
import { USER_ROLES, type UserRole } from "@/features/auth/types";

/**
 * The capability matrix is the executable form of the permission table in
 * `.claude/rules/architecture.md`, enforced in both UI and data layers. One
 * table-driven test guards against an accidental widening (e.g. a student
 * gaining analytics access). `canChangeRole` guards the Phase 12.6 invariants.
 */
type Capability = (role: UserRole) => boolean;

// Expected boolean per capability × role — the source of truth, asserted directly.
const MATRIX: Record<string, { fn: Capability; admin: boolean; teacher: boolean; student: boolean }> = {
  canManageUsers: { fn: canManageUsers, admin: true, teacher: false, student: false },
  canManageTeachers: { fn: canManageTeachers, admin: true, teacher: false, student: false },
  canManageStudents: { fn: canManageStudents, admin: true, teacher: true, student: false },
  canManageContent: { fn: canManageContent, admin: true, teacher: true, student: false },
  canAccessAnalytics: { fn: canAccessAnalytics, admin: true, teacher: true, student: false },
  canAccessReports: { fn: canAccessReports, admin: true, teacher: true, student: false },
};

describe("capability matrix", () => {
  for (const [name, row] of Object.entries(MATRIX)) {
    it(`${name} matches the permission table for every role`, () => {
      expect(row.fn("admin")).toBe(row.admin);
      expect(row.fn("teacher")).toBe(row.teacher);
      expect(row.fn("student")).toBe(row.student);
    });
  }
});

describe("role predicates", () => {
  it("isAdmin / isTeacher / isStudent identify exactly one role", () => {
    expect([isAdmin("admin"), isTeacher("admin"), isStudent("admin")]).toEqual([true, false, false]);
    expect([isAdmin("teacher"), isTeacher("teacher"), isStudent("teacher")]).toEqual([false, true, false]);
    expect([isAdmin("student"), isTeacher("student"), isStudent("student")]).toEqual([false, false, true]);
  });

  it("isUserRole guards untrusted values", () => {
    for (const role of USER_ROLES) expect(isUserRole(role)).toBe(true);
    expect(isUserRole("superadmin")).toBe(false);
    expect(isUserRole(null)).toBe(false);
    expect(isUserRole(42)).toBe(false);
  });
});

describe("canChangeRole (Phase 12.6 security invariant)", () => {
  const base = {
    actorRole: "admin" as UserRole,
    targetCurrentRole: "student" as UserRole,
    targetNewRole: "teacher" as UserRole,
    isSelf: false,
  };

  it("allows an admin to promote student → teacher and demote back", () => {
    expect(canChangeRole(base)).toBe(true);
    expect(
      canChangeRole({ ...base, targetCurrentRole: "teacher", targetNewRole: "student" }),
    ).toBe(true);
  });

  it("rejects a non-admin actor", () => {
    expect(canChangeRole({ ...base, actorRole: "teacher" })).toBe(false);
    expect(canChangeRole({ ...base, actorRole: "student" })).toBe(false);
  });

  it("rejects changing one's own role", () => {
    expect(canChangeRole({ ...base, isSelf: true })).toBe(false);
  });

  it("never allows a transition to or from admin (infrastructure-only)", () => {
    expect(canChangeRole({ ...base, targetNewRole: "admin" })).toBe(false);
    expect(canChangeRole({ ...base, targetCurrentRole: "admin", targetNewRole: "teacher" })).toBe(false);
  });

  it("rejects a no-op (must be an actual change)", () => {
    expect(
      canChangeRole({ ...base, targetCurrentRole: "teacher", targetNewRole: "teacher" }),
    ).toBe(false);
  });
});
