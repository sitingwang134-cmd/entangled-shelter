import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const researchRoot = path.join(
  root,
  "docs/research/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c",
);
const assetRoot = path.join(
  root,
  "public/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c",
);
const extraction = JSON.parse(
  await readFile(path.join(researchRoot, "desktop-1440-extraction.json"), "utf8"),
);

function backgroundUrls(value) {
  const urls = [];
  const pattern = /url\(["']?([^"')]+)["']?\)/g;
  for (const match of value.matchAll(pattern)) urls.push(match[1]);
  return urls;
}

const candidateUrls = [
  ...extraction.assets.images.map((image) => image.src),
  ...extraction.assets.videos.flatMap((video) => [video.src, video.poster]),
  ...extraction.assets.backgroundImages.flatMap((item) => backgroundUrls(item.backgroundImage)),
  ...extraction.assets.favicons.map((favicon) => favicon.href),
  ...extraction.assets.resources
    .filter((resource) =>
      /^(img|image|video|media|font|css|link)$/i.test(resource.initiatorType) ||
      /\.(?:png|jpe?g|webp|avif|gif|svg|mp4|webm|woff2?|css)(?:\?|$)/i.test(resource.name),
    )
    .map((resource) => resource.name),
].filter((url) => typeof url === "string" && /^https?:\/\//.test(url));

function score(url) {
  const parsed = new URL(url);
  const width = Number(parsed.searchParams.get("width") || 0);
  const height = Number(parsed.searchParams.get("height") || 0);
  return width * height + width * 10 + height;
}

const grouped = new Map();
for (const url of candidateUrls) {
  const parsed = new URL(url);
  const key = `${parsed.origin}${parsed.pathname}`;
  const previous = grouped.get(key);
  if (!previous || score(url) > score(previous)) grouped.set(key, url);
}

const urls = [...grouped.values()];
const outputDir = path.join(assetRoot, "media");
await mkdir(outputDir, { recursive: true });

function safeName(url, index) {
  const parsed = new URL(url);
  const raw = decodeURIComponent(path.basename(parsed.pathname)) || `asset-${index}`;
  const extension = path.extname(raw).slice(0, 8);
  const stem = path.basename(raw, extension).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 74) || "asset";
  const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 10);
  return `${String(index + 1).padStart(3, "0")}-${stem}-${hash}${extension || ".bin"}`;
}

const manifest = [];
let cursor = 0;
const workerCount = 4;

async function worker() {
  while (cursor < urls.length) {
    const index = cursor++;
    const url = urls[index];
    const fileName = safeName(url, index);
    const destination = path.join(outputDir, fileName);
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
        },
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      await writeFile(destination, bytes);
      manifest[index] = {
        url,
        path: `public/sites/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/media/${fileName}`,
        contentType: response.headers.get("content-type"),
        bytes: bytes.byteLength,
        status: "downloaded",
      };
    } catch (error) {
      manifest[index] = {
        url,
        path: null,
        contentType: null,
        bytes: 0,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
    if ((index + 1) % 25 === 0 || index + 1 === urls.length) {
      console.log(`Processed ${index + 1}/${urls.length}`);
    }
  }
}

await Promise.all(Array.from({ length: workerCount }, () => worker()));

const downloaded = manifest.filter((item) => item.status === "downloaded");
const failed = manifest.filter((item) => item.status === "failed");
const totalBytes = downloaded.reduce((sum, item) => sum + item.bytes, 0);
const result = {
  sourceUrl: "https://www.shopify.com/editions/winter2026",
  generatedAt: new Date().toISOString(),
  requested: urls.length,
  downloaded: downloaded.length,
  failed: failed.length,
  totalBytes,
  assets: manifest,
};

await writeFile(path.join(researchRoot, "ARTIFACT_MANIFEST.json"), JSON.stringify(result, null, 2));
await writeFile(
  path.join(researchRoot, "ARTIFACT_MANIFEST.md"),
  [
    "# Artifact Manifest",
    "",
    "- Source: `https://www.shopify.com/editions/winter2026`",
    `- Requested assets: ${result.requested}`,
    `- Downloaded assets: ${result.downloaded}`,
    `- Failed assets: ${result.failed}`,
    `- Downloaded bytes: ${result.totalBytes}`,
    "- Extraction evidence: `desktop-1440-extraction.json`",
    "- No generated substitute assets were used.",
    "",
    "Detailed URL-to-local-path mappings are in `ARTIFACT_MANIFEST.json`.",
    "",
  ].join("\n"),
);

console.log(JSON.stringify({
  requested: result.requested,
  downloaded: result.downloaded,
  failed: result.failed,
  totalMiB: Number((result.totalBytes / 1024 / 1024).toFixed(2)),
}));

