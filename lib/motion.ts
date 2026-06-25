import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Reduced-motion primitives shared between the no-flash inline script, the
 * MotionProvider, and the settings form. Mirrors `lib/theme.ts`: the user's
 * `user_settings.reduced_motion` preference is also kept in localStorage so it
 * can be applied before first paint (the DB isn't available that early), and
 * persisted to the DB as the cross-session record.
 *
 * This is the *explicit opt-in* override. The OS-level
 * `@media (prefers-reduced-motion: reduce)` guard in `globals.css` still applies
 * independently; setting `data-reduced-motion="true"` only ever *adds* the
 * reduced-motion treatment, it never forces motion back on against an OS setting.
 */
export const REDUCED_MOTION_STORAGE_KEY = STORAGE_KEYS.reducedMotion;

/** The `<html>` attribute the CSS guard keys off when the user opts in. */
export const REDUCED_MOTION_ATTR = "data-reduced-motion";

/**
 * Inline JS (an IIFE) that runs before first paint to set the
 * `data-reduced-motion` attribute from the stored preference, so an opted-in
 * user never sees a flash of animation on load. Dependency-free and defensive
 * so a storage error never blocks rendering.
 *
 * Shipped as opaque markup via `dangerouslySetInnerHTML` (see
 * `components/theme-init-script.tsx`) for the same React-19 reason the theme
 * script is — React must never reconcile a `<script>` element on the client.
 */
export const reducedMotionInitScript = `(function(){try{var k="${REDUCED_MOTION_STORAGE_KEY}";if(localStorage.getItem(k)==="true"){document.documentElement.setAttribute("${REDUCED_MOTION_ATTR}","true");}}catch(e){}})();`;
