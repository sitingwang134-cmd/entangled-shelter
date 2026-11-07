import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(
  root,
  "docs/research/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/source.html",
);
const outputPath = path.join(
  root,
  "public/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/mirror-live.html",
);

const source = await readFile(sourcePath, "utf8");
await writeFile(outputPath, source);
console.log(`Generated ${outputPath}`);

