import type { NextConfig } from "next";

const staticExport = process.env.ENTANGLED_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  output: staticExport ? "export" : undefined,
  ...(staticExport ? { trailingSlash: true, images: { unoptimized: true } } : {}),
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: process.cwd(),
  },
  ...(staticExport ? {} : { async rewrites() {
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
  } }),
};

export default nextConfig;

