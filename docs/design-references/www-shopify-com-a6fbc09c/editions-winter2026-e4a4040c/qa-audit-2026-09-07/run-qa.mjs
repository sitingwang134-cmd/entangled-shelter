import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const sharp = require("sharp");

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const targets = [
  { name: "original", url: "https://www.shopify.com/editions/winter2026" },
  { name: "local", url: "http://127.0.0.1:3000/editions/winter2026" },
];
const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];
const expectedText = [
  "Shopify Editions",
  "Winter '26",
  "The Renaissance Edition",
  "A new world of commerce. 150+ product updates.",
  "Sidekick",
  "Agentic",
  "Online",
  "Retail",
  "Marketing",
  "Checkout",
  "Operations",
  "Shop app",
  "B2B",
  "Finance",
  "Shipping",
  "Developer",
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: edge,
  headless: true,
  args: [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--disable-gpu-sandbox",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ],
});

async function auditTarget(target, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: "no-preference",
    locale: "en-US",
    colorScheme: "light",
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  const badResponses = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? "unknown" });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) badResponses.push({ status: response.status(), url: response.url() });
  });

  const startedAt = Date.now();
  let navigationError = null;
  try {
    await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }
  await page.locator("body").waitFor({ state: "visible", timeout: 30_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(8_000);
  const preflightHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= preflightHeight; y += Math.max(620, viewport.height * 0.8)) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(110);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1_500);

  const heroPath = path.join(outputDir, `${target.name}-${viewport.name}-hero.png`);
  await page.screenshot({ path: heroPath, animations: "disabled" });

  const bodyText = await page.locator("body").innerText();
  const structure = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector("main");
    const images = [...document.images];
    const headings = [...document.querySelectorAll("h1,h2,h3")]
      .map((heading) => ({
        tag: heading.tagName,
        text: heading.textContent?.replace(/\s+/g, " ").trim().slice(0, 160) ?? "",
      }))
      .filter((heading) => heading.text)
      .slice(0, 40);
    const sectionIds = [...document.querySelectorAll("section[id], [data-section-name]")]
      .map((node) => node.id || node.getAttribute("data-section-name"))
      .filter(Boolean);
    const nav = document.querySelector("header,nav");
    const heroHeading = [...document.querySelectorAll("h1,h2,h3,p")].find((node) =>
      node.textContent?.includes("The Renaissance Edition"),
    );
    return {
      clientWidth: root.clientWidth,
      clientHeight: root.clientHeight,
      scrollWidth: root.scrollWidth,
      scrollHeight: root.scrollHeight,
      horizontalOverflowPx: Math.max(0, root.scrollWidth - root.clientWidth),
      mainPresent: Boolean(main),
      mainId: main?.id ?? null,
      headerPresent: Boolean(document.querySelector("header")),
      navPresent: Boolean(document.querySelector("nav")),
      linkCount: document.links.length,
      buttonCount: document.querySelectorAll("button").length,
      imageCount: images.length,
      brokenImageCount: images.filter((image) => image.complete && image.naturalWidth === 0).length,
      videoCount: document.querySelectorAll("video").length,
      headings,
      sectionIds: [...new Set(sectionIds)].slice(0, 60),
      navPosition: nav ? getComputedStyle(nav).position : null,
      heroHeadingRect: heroHeading
        ? {
            top: Math.round(heroHeading.getBoundingClientRect().top),
            left: Math.round(heroHeading.getBoundingClientRect().left),
            width: Math.round(heroHeading.getBoundingClientRect().width),
            height: Math.round(heroHeading.getBoundingClientRect().height),
          }
        : null,
    };
  });

  const initialScrollY = await page.evaluate(() => window.scrollY);
  await page.mouse.move(Math.floor(viewport.width / 2), Math.floor(viewport.height / 2));
  await page.mouse.wheel(0, 1_200);
  await page.waitForTimeout(700);
  const wheelScrollY = await page.evaluate(() => window.scrollY);

  const midTarget = Math.min(
    Math.floor(structure.scrollHeight * 0.45),
    Math.max(0, structure.scrollHeight - viewport.height),
  );
  const midSection = page.locator("#checkout").first();
  if ((await midSection.count()) > 0) {
    await midSection.scrollIntoViewIfNeeded();
  } else {
    await page.evaluate((y) => window.scrollTo(0, y), midTarget);
  }
  await page.waitForTimeout(2_000);
  const midScrollY = await page.evaluate(() => window.scrollY);
  const midPath = path.join(outputDir, `${target.name}-${viewport.name}-mid-scroll.png`);
  await page.screenshot({ path: midPath, animations: "disabled" });

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(1_000);
  const bottomScrollY = await page.evaluate(() => window.scrollY);
  const maxScrollY = Math.max(0, structure.scrollHeight - viewport.height);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(250);
  const menuButton = page.locator('button[aria-label="Menu"]').first();
  let mobileMenu = { tested: false, before: null, afterOpen: null, afterClose: null };
  if ((await menuButton.count()) > 0 && (await menuButton.isVisible())) {
    mobileMenu.tested = true;
    mobileMenu.before = await menuButton.getAttribute("aria-expanded");
    await menuButton.click();
    await page.waitForTimeout(350);
    mobileMenu.afterOpen = await menuButton.getAttribute("aria-expanded");
    await menuButton.click();
    await page.waitForTimeout(350);
    mobileMenu.afterClose = await menuButton.getAttribute("aria-expanded");
  }

  const screenshotBuffer = await fs.readFile(heroPath);
  const result = {
    target: target.name,
    requestedUrl: target.url,
    finalUrl: page.url(),
    viewport,
    navigationMs: Date.now() - startedAt,
    navigationError,
    title: await page.title(),
    expectedText: Object.fromEntries(expectedText.map((text) => [text, bodyText.includes(text)])),
    bodyTextLength: bodyText.length,
    structure,
    scrolling: {
      initialScrollY,
      wheelScrollY,
      wheelMoved: wheelScrollY > initialScrollY,
      requestedMidScrollY: midTarget,
      actualMidScrollY: midScrollY,
      maxScrollY,
      bottomScrollY,
      reachedBottom: Math.abs(bottomScrollY - maxScrollY) <= 2,
    },
    mobileMenu,
    pageErrors: [...new Set(pageErrors)],
    consoleErrors: [...new Set(consoleErrors)],
    requestFailures: requestFailures.slice(0, 100),
    badResponses: badResponses.slice(0, 100),
    heroScreenshot: path.basename(heroPath),
    heroScreenshotSha256: createHash("sha256").update(screenshotBuffer).digest("hex"),
    midScrollScreenshot: path.basename(midPath),
  };
  await context.close();
  return result;
}

async function compareScreenshots(viewport) {
  const originalPath = path.join(outputDir, `original-${viewport.name}-hero.png`);
  const localPath = path.join(outputDir, `local-${viewport.name}-hero.png`);
  const original = await sharp(originalPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const local = await sharp(localPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (
    original.info.width !== local.info.width ||
    original.info.height !== local.info.height ||
    original.info.channels !== local.info.channels
  ) {
    return {
      viewport: viewport.name,
      comparable: false,
      original: original.info,
      local: local.info,
    };
  }

  const pixelCount = original.info.width * original.info.height;
  const channels = original.info.channels;
  let changedPixels = 0;
  let exactChangedPixels = 0;
  let sumAbsoluteError = 0;
  let sumSquaredError = 0;
  const diff = Buffer.alloc(original.data.length);

  for (let offset = 0; offset < original.data.length; offset += channels) {
    let maxDifference = 0;
    let exactDifference = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = Math.abs(original.data[offset + channel] - local.data[offset + channel]);
      maxDifference = Math.max(maxDifference, delta);
      exactDifference ||= delta > 0;
      sumAbsoluteError += delta;
      sumSquaredError += delta * delta;
    }
    if (exactDifference) exactChangedPixels += 1;
    if (maxDifference > 12) changedPixels += 1;
    if (maxDifference > 12) {
      diff[offset] = 255;
      diff[offset + 1] = 25;
      diff[offset + 2] = 80;
      diff[offset + 3] = 255;
    } else {
      const grey = Math.round(
        (original.data[offset] + original.data[offset + 1] + original.data[offset + 2]) / 3,
      );
      diff[offset] = grey;
      diff[offset + 1] = grey;
      diff[offset + 2] = grey;
      diff[offset + 3] = 75;
    }
  }

  const diffPath = path.join(outputDir, `diff-${viewport.name}-hero.png`);
  await sharp(diff, {
    raw: {
      width: original.info.width,
      height: original.info.height,
      channels,
    },
  })
    .png()
    .toFile(diffPath);

  return {
    viewport: viewport.name,
    comparable: true,
    width: original.info.width,
    height: original.info.height,
    changedPixelThreshold: 12,
    changedPixels,
    changedPercent: Number(((changedPixels / pixelCount) * 100).toFixed(6)),
    exactChangedPixels,
    exactChangedPercent: Number(((exactChangedPixels / pixelCount) * 100).toFixed(6)),
    meanAbsoluteErrorRgb: Number((sumAbsoluteError / (pixelCount * 3)).toFixed(6)),
    rootMeanSquaredErrorRgb: Number(Math.sqrt(sumSquaredError / (pixelCount * 3)).toFixed(6)),
    diffImage: path.basename(diffPath),
  };
}

const results = [];
try {
  for (const viewport of viewports) {
    for (const target of targets) {
      console.log(`Auditing ${target.name} at ${viewport.name}`);
      results.push(await auditTarget(target, viewport));
    }
  }
} finally {
  await browser.close();
}

const comparisons = [];
for (const viewport of viewports) {
  comparisons.push(await compareScreenshots(viewport));
}

const report = {
  runAt: new Date().toISOString(),
  userAgent: "Microsoft Edge via Playwright",
  expectedTitle: "Shopify Editions | Winter '26",
  results,
  comparisons,
};
await fs.writeFile(path.join(outputDir, "qa-results.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
