// @vitest-environment jsdom
import type { ReactNode } from "react";

import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AXE_FRAGMENT_OPTIONS, axe } from "@/test/a11y";
import { renderWithIntl } from "@/test/render-with-intl";

/**
 * Stub the locale-aware navigation **primitive** (`@/i18n/navigation`) with a
 * plain anchor. It is Next/next-intl infrastructure — not the unit under test —
 * and next-intl's `createNavigation` can't resolve `next/navigation` under
 * Vitest. The picker's own logic (filtering, the live count, i18n) all runs for
 * real; only the link target is neutralized (same boundary-stub spirit as the
 * `server-only` alias). `vi.mock` is hoisted, so this applies before import.
 */
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href: _href, ...rest }: { children: ReactNode; href?: unknown }) => (
    <a href="#" {...rest}>
      {children}
    </a>
  ),
  redirect: () => undefined,
  usePathname: () => "/",
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  }),
  getPathname: () => "/",
}));

// Imported after the mock is declared (the mock is hoisted above imports anyway).
const { StudentPicker } = await import("@/features/analytics/components/student-picker");

/**
 * The analytics student lookup — the component whose missing live-result
 * announcement was the single Phase 15 defect (WCAG 4.1.3). These tests prove the
 * `aria-live` count renders **real translated copy** (Arabic + English, count
 * interpolated) and that the component is a11y-clean. Real catalogs flow through
 * `renderWithIntl`, so a rendered message key would fail the test.
 */
const students = [
  { id: "s1", name: "محمد علي" },
  { id: "s2", name: "أحمد حسن" },
  { id: "s3", name: "سارة خالد" },
];

function picker(locale: "ar" | "en") {
  return renderWithIntl(
    <StudentPicker
      students={students}
      range="30d"
      label="Search students"
      placeholder="Search by name"
      emptyText="No matching students"
    />,
    { locale },
  );
}

afterEach(cleanup);

describe("StudentPicker (i18n / a11y)", () => {
  it("announces the Arabic result count and links the match", async () => {
    const user = userEvent.setup();
    picker("ar");
    await user.type(screen.getByRole("searchbox"), "محمد"); // matches exactly 1

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("مطابق"); // real Arabic copy, not the key
    expect(status.textContent).not.toContain("searchResults");
    expect(screen.getByRole("link", { name: "محمد علي" })).toBeInTheDocument();
  });

  it("announces the English plural count for multiple matches", async () => {
    const user = userEvent.setup();
    picker("en");
    await user.type(screen.getByRole("searchbox"), "د"); // in محمد / أحمد / خالد → 3

    expect(screen.getByRole("status")).toHaveTextContent("3 matching students");
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("announces zero matches without rendering any links", async () => {
    const user = userEvent.setup();
    picker("ar");
    await user.type(screen.getByRole("searchbox"), "zzz");

    expect(screen.getByRole("status").textContent?.trim()).not.toBe("");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = picker("en");
    expect(await axe(container, AXE_FRAGMENT_OPTIONS)).toHaveNoViolations();
  });
});
