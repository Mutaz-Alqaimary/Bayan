/**
 * Canonical site origin for build-stable, absolute URLs — `metadataBase`,
 * canonical / hreflang links, `robots.txt`, and `sitemap.xml` (Phase 19).
 *
 * Prefers the explicit `NEXT_PUBLIC_SITE_URL` (set per environment in Vercel);
 * falls back to the Vercel-provided deployment origin, then to the known
 * production origin. It never throws so metadata and sitemap generation stay
 * resilient; `NEXT_PUBLIC_SITE_URL` is documented as required for production in
 * `docs/Deployment.md`.
 *
 * This is intentionally separate from the request-scoped origin resolution used
 * for auth redirect links in the server actions (which prefer live request
 * headers) — metadata and the sitemap need a stable value, not a per-request one.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "https://bayan-reading.vercel.app";
}
