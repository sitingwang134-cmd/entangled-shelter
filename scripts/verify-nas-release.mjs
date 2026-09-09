import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const origin = process.env.SITE_URL || "http://192.168.31.214:3090";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const html = await fs.readFile("out/index.html", "utf8");
const response = await fetch(`${origin}/`, { signal: AbortSignal.timeout(15_000) });
assert.equal(response.status, 200);
const deployed = await response.text();
assert.equal(hash(deployed), hash(html), "NAS must serve the exact new export");
assert.ok(deployed.includes('data-motion="full"'));
assert.ok(!deployed.includes("data-motion-toggle"), "The removed control must not be shipped");

const historyHtml = await fs.readFile("out/history.html", "utf8");
const historyResponse = await fetch(`${origin}/history`, { signal: AbortSignal.timeout(15_000) });
assert.equal(historyResponse.status, 200);
const deployedHistory = await historyResponse.text();
assert.equal(hash(deployedHistory), hash(historyHtml), "NAS must serve the exact history export");
assert.ok(deployedHistory.includes("The Decision Archive"));

const assets = new Set([...html.matchAll(/(?:src|href)="([^"?#]+)"/g)]
  .map((match) => match[1]).filter((url) => url.startsWith("/_next/static/")));
for (const name of await fs.readdir("out/entangled")) {
  if (/\.webp$|-depth\.png$|\.mp4$|^icon\.svg$/.test(name)) assets.add(`/entangled/${name}`);
}
for (const name of await fs.readdir("out/entangled/choices")) {
  if (/\.(webp|json)$/.test(name)) assets.add(`/entangled/choices/${name}`);
}
const checked = [];
for (const name of await fs.readdir('out/entangled/paper-roll')) {
  if (/\.(html|js)$/.test(name)) assets.add(`/entangled/paper-roll/${name}`);
}
for (const name of await fs.readdir("out/entangled/choices-v4")) {
  if (/\.(webp|json)$/.test(name)) assets.add(`/entangled/choices-v4/${name}`);
}
for (const url of assets) {
  const result = await fetch(`${origin}${url}`, { signal: AbortSignal.timeout(15_000) });
  assert.equal(result.status, 200, url);
  const bytes = Buffer.from(await result.arrayBuffer());
  const local = await fs.readFile(path.join("out", url.slice(1)));
  assert.equal(hash(bytes), hash(local), `Asset hash mismatch: ${url}`);
  checked.push({ url, bytes: bytes.length, sha256: hash(bytes) });
}
const report = {
  generatedAt: new Date().toISOString(), origin, passed: true,
  htmlSha256: hash(html), historyHtmlSha256: hash(historyHtml), fullMotionMarkup: true, toggleAbsent: true,
  assets: checked,
  scope: "HTTP deployment and byte-level asset integrity, not visual animation acceptance."
};
await fs.mkdir("docs/entangled-shelter/deployment", { recursive: true });
await fs.writeFile("docs/entangled-shelter/deployment/nas-release-check.json", JSON.stringify(report, null, 2));
console.log(`NAS release verified: HTML and ${checked.length} assets match; full motion, no toggle.`);
