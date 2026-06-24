import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Theme primitives shared between the no-flash inline script, the ThemeProvider,
 * and the theme toggle. Mirrors the `user_settings.theme` values so Phase 12 can
 * persist the same shape.
 */
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEMES: readonly Theme[] = ["light", "dark", "system"] as const;
export const DEFAULT_THEME: Theme = "system";
export const THEME_STORAGE_KEY = STORAGE_KEYS.theme;

/**
 * Inline JS (an IIFE) that runs before first paint to set the `.dark` class and
 * `color-scheme` from the stored preference, eliminating a theme/direction flash.
 * Dependency-free and defensive so a storage error never blocks rendering.
 *
 * It is rendered into the document as opaque markup via `dangerouslySetInnerHTML`
 * (see `lib/theme.tsx` → `ThemeInitScript`) rather than as a JSX `<script>`
 * element: React 19 warns whenever it reconciles a `<script>` *element* on the
 * client (inline or `src`), which happens every time the locale layout re-renders
 * on a language toggle. Wrapping the raw string means React never creates a
 * `<script>` fiber, while the script still ships in the server HTML and executes
 * before paint.
 */
export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k)||"${DEFAULT_THEME}";var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var d=t==="dark"||(t==="system"&&m);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
