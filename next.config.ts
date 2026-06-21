import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Render a full standalone 404 for URLs that match no route. Required here
    // because the root layout lives under a top-level dynamic segment
    // (app/[locale]), so a global 404 can't be composed from a root layout.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
