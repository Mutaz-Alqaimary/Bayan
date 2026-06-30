import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Development-only tooling. Inert unless `ANALYZE=true` is set, so `dev`, `build`,
// `start`, and production are completely unaffected. Run `ANALYZE=true next build`
// to regenerate the bundle treemaps (see docs/phases/14-performance.md).
const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Render a full standalone 404 for URLs that match no route. Required here
    // because the root layout lives under a top-level dynamic segment
    // (app/[locale]), so a global 404 can't be composed from a root layout.
    globalNotFound: true,
  },
};

export default withAnalyzer(withNextIntl(nextConfig));
