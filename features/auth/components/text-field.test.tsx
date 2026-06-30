// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { AXE_FRAGMENT_OPTIONS, axe } from "@/test/a11y";
import { TextField } from "@/features/auth/components/text-field";
import { renderWithIntl } from "@/test/render-with-intl";

afterEach(cleanup);

/**
 * Representative form field. Covers the BiDi invariant (an email field stays LTR
 * inside an RTL page so it never visually scrambles), the accessible error wiring,
 * and the automated a11y smoke. Rendered inside the real `ar` (RTL) context so the
 * `dir="ltr"` override is tested against genuine inherited direction.
 */
const registration = {
  name: "email",
  onChange: async () => {},
  onBlur: async () => {},
  ref: () => {},
} as unknown as UseFormRegisterReturn;

describe("TextField (RTL / a11y)", () => {
  it("keeps an email field LTR inside an RTL page (BiDi)", () => {
    renderWithIntl(
      <TextField id="email" label="البريد الإلكتروني" type="email" dir="ltr" registration={registration} />,
      { locale: "ar" },
    );
    expect(screen.getByTestId("intl-root")).toHaveAttribute("dir", "rtl");
    expect(screen.getByLabelText("البريد الإلكتروني")).toHaveAttribute("dir", "ltr");
  });

  it("wires the error to the input accessibly", () => {
    renderWithIntl(
      <TextField
        id="email"
        label="البريد الإلكتروني"
        registration={registration}
        error="هذا الحقل مطلوب"
      />,
      { locale: "ar" },
    );
    const input = screen.getByLabelText("البريد الإلكتروني");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("هذا الحقل مطلوب");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(
      <TextField id="email" label="Email" type="email" registration={registration} />,
      { locale: "en" },
    );
    expect(await axe(container, AXE_FRAGMENT_OPTIONS)).toHaveNoViolations();
  });
});
