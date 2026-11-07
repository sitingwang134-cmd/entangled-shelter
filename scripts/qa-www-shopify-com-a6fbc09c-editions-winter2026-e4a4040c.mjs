import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const projectRoot = process.cwd();
const outputDir = path.join(
  projectRoot,
  "docs/design-references/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c/qa",
);
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const appUrl = process.env.CLONE_URL ?? "http://127.0.0.1:3000";

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: edge,
  headless: true,
  args: ["--disable-gpu-sandbox"],
});

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
];

const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForURL("**/editions/winter2026", { timeout: 20_000 });
  await page.locator("body").waitFor({ state: "visible", timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(8_000);

  const bodyText = await page.locator("body").innerText();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));

  await page.screenshot({
    path: path.join(outputDir, `${viewport.name}.png`),
    animations: "disabled",
  });

  const beforeScroll = await page.evaluate(() => window.scrollY);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.wheel(0, 1_200);
  await page.waitForTimeout(500);
  const afterScroll = await page.evaluate(() => window.scrollY);

  results.push({
    viewport,
    pageUrl: page.url(),
    pageTitle: await page.title(),
    hasEditions: bodyText.includes("Editions"),
    hasSidekick: bodyText.includes("Sidekick"),
    dimensions,
    scrollMoved: afterScroll > beforeScroll,
    pageErrors: errors,
  });

  await context.close();
}

await browser.close();
await fs.writeFile(
  path.join(outputDir, "qa-results.json"),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => !result.scrollMoved)) {
  throw new Error("Native mouse-wheel scrolling failed in one or more viewports.");
}

