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
  const frameElement = page.locator("iframe");
  await frameElement.waitFor({ state: "visible", timeout: 20_000 });
  const iframeHandle = await frameElement.elementHandle();
  let frame = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    frame = await iframeHandle?.contentFrame();
    if (frame?.url().includes("/editions/winter2026")) break;
    await page.waitForTimeout(250);
  }
  if (!frame?.url().includes("/editions/winter2026")) {
    throw new Error(`Source frame did not attach for ${viewport.name}`);
  }
  await frame.waitForLoadState("domcontentloaded", { timeout: 60_000 });
  await frame.locator("body").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(2_500);

  const bodyText = await frame.locator("body").innerText();
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

  const beforeScroll = await frame.evaluate(() => window.scrollY);
  await frame.evaluate(() => window.scrollTo(0, 1_500));
  await frame.waitForTimeout(350);
  const afterScroll = await frame.evaluate(() => window.scrollY);

  results.push({
    viewport,
    iframeUrl: frame.url(),
    iframeTitle: await frameElement.getAttribute("title"),
    hasEditions: bodyText.includes("Editions"),
    hasSidekick: bodyText.includes("Sidekick"),
    hostDimensions: dimensions,
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
