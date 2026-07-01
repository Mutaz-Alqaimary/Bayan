// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AXE_FRAGMENT_OPTIONS, axe } from "@/test/a11y";
import { renderWithIntl } from "@/test/render-with-intl";

import { PrintButton } from "./print-button";

/**
 * The reporting surface's only interactive control. These tests prove it renders
 * **real translated** copy (Arabic + English, not the message key), triggers the
 * browser's native print dialog (the approved "Save as PDF" path), and is
 * a11y-clean.
 */
afterEach(cleanup);

describe("PrintButton", () => {
  it("renders the real Arabic label", () => {
    renderWithIntl(<PrintButton />, { locale: "ar" });
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("PDF"); // Arabic copy embeds the acronym
    expect(button.textContent).not.toContain("reports.print");
  });

  it("renders the real English label", () => {
    renderWithIntl(<PrintButton />, { locale: "en" });
    expect(
      screen.getByRole("button", { name: /save as pdf/i }),
    ).toBeInTheDocument();
  });

  it("opens the browser print dialog when clicked", async () => {
    const printSpy = vi.fn();
    vi.stubGlobal("print", printSpy);
    const user = userEvent.setup();

    renderWithIntl(<PrintButton />, { locale: "en" });
    await user.click(screen.getByRole("button"));

    expect(printSpy).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PrintButton />, { locale: "en" });
    expect(await axe(container, AXE_FRAGMENT_OPTIONS)).toHaveNoViolations();
  });
});
