import { reducedMotionInitScript } from "@/lib/motion";
import { themeInitScript } from "@/lib/theme";

/**
 * No-flash theme initializer.
 *
 * Renders the init script as **opaque HTML** via `dangerouslySetInnerHTML`
 * instead of a JSX `<script>` element. React 19 warns ("Encountered a script tag
 * while rendering React component") whenever it reconciles a `<script>` element
 * on the client — which happens on every locale toggle, since that re-renders the
 * root layout. Wrapping the raw string means React only ever sets an innerHTML
 * string and never creates a `<script>` fiber, so the warning can't fire.
 *
 * The script still ships inside the server-rendered HTML, so it executes before
 * first paint (no theme/direction flash). It does not need to re-run on client
 * navigation — the theme is already applied — and `dangerouslySetInnerHTML` does
 * not re-execute it, which is exactly what we want.
 *
 * Place as the first child of `<body>` so it runs before any visible content.
 */
/**
 * Deliberately rendered as opaque HTML.
 *
 * React 19 warns when reconciling script elements
 * during locale transitions. Rendering the script
 * through innerHTML avoids script fibers entirely
 * while preserving pre-paint theme initialization.
 */
export function ThemeInitScript() {
  return (
    <div
      hidden
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `<script>${themeInitScript}${reducedMotionInitScript}</script>`,
      }}
    />
  );
}
