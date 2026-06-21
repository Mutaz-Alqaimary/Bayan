import { IBM_Plex_Sans_Arabic } from "next/font/google";

/**
 * Single typography system for the entire app (see `.claude/rules/design-system.md`).
 * IBM Plex Sans Arabic covers both Arabic and Latin glyphs, so one family serves the
 * Arabic-first UI and any embedded Latin text without a second font.
 *
 * Exposed as the `--font-sans` CSS variable, which `globals.css` maps onto Tailwind's
 * `font-sans` token.
 */
export const fontSans = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
