import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Always import `Link`, `redirect`,
 * `usePathname`, `useRouter`, and `getPathname` from here instead of `next/link`
 * or `next/navigation` so the active locale prefix is handled automatically and
 * no route is ever hardcoded without its locale.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
