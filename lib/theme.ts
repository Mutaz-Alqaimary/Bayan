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
 * Runs before first paint (injected into <head>) to set the `.dark` class and
 * `color-scheme` from the stored preference, eliminating a theme/direction flash.
 * Kept dependency-free and defensive so a storage error never blocks rendering.
 */
export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var t=localStorage.getItem(k)||"${DEFAULT_THEME}";var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var d=t==="dark"||(t==="system"&&m);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
