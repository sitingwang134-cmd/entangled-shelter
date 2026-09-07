import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/editions/winter2026",
          destination:
            "/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/mirror-live.html",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
