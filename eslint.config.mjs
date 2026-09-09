import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".tools/**",
    "public/entangled/paper-roll/*.min.js",
    // Generated JavaScript used only by the code-only SSR smoke test.
    "temp/choice-render-test/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
