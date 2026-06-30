// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AXE_FRAGMENT_OPTIONS, axe } from "@/test/a11y";
import { FormAlert } from "@/features/auth/components/form-alert";

/**
 * Representative inline error banner. Confirms the announced-alert wiring and is
 * part of the Phase 15 → 16 automated-a11y smoke (`vitest-axe`).
 */
afterEach(cleanup);

describe("FormAlert", () => {
  it("renders an announced alert with the title and description", () => {
    render(<FormAlert title="Sign-in failed" description="Check your credentials." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Sign-in failed");
    expect(alert).toHaveTextContent("Check your credentials.");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<FormAlert title="Error" description="Details" />);
    expect(await axe(container, AXE_FRAGMENT_OPTIONS)).toHaveNoViolations();
  });
});
