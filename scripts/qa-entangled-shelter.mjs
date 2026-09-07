import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const appUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
const outputDir = path.join(process.cwd(), "docs/design-references/entangled-shelter/qa");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
});

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900 },
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

  await page.goto(appUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.screenshot({
    path: path.join(outputDir, `${viewport.name}-home.png`),
    animations: "disabled",
  });

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    before: window.scrollY,
  }));
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(250);
  const afterScroll = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.getByRole("button", { name: /打开选择器/ }).first().click();
  const optionButtons = page.locator('button[aria-pressed="false"]');
  await optionButtons.nth(0).click();
  await optionButtons.nth(1).click();
  await page.getByRole("button", { name: /选择宇宙规则/ }).click();

  await page.getByRole("button", { name: /命运扑克/ }).click();
  await page.getByRole("button", { name: /发牌决定/ }).click();
  const pokerResult = await page.locator('[role="dialog"] strong').innerText();
  await page.getByRole("button", { name: "再坍缩一次" }).click();

  await page.getByRole("button", { name: /剪刀石头布/ }).click();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await page.getByRole("button", { name: "再坍缩一次" }).count()) break;
    await page.getByRole("button", { name: /石头/ }).click();
  }
  if (!(await page.getByRole("button", { name: "再坍缩一次" }).count())) {
    throw new Error(`${viewport.name}: rock-paper-scissors did not resolve`);
  }
  const rpsResult = await page.locator('[role="dialog"] strong').innerText();
  await page.getByRole("button", { name: "再坍缩一次" }).click();

  await page.getByRole("button", { name: /先猜后抽/ }).click();
  await page.locator('button[aria-pressed="false"]').first().click();
  await page.getByRole("button", { name: /先猜后抽/ }).click();
  const guessResult = await page.locator('[role="dialog"] strong').innerText();

  await page.screenshot({
    path: path.join(outputDir, `${viewport.name}-result.png`),
    animations: "disabled",
  });

  const pageTitle = await page.title();
  results.push({
    viewport,
    title: pageTitle,
    hasBrand: pageTitle.includes("Entangled Shelter"),
    noHorizontalOverflow: dimensions.scrollWidth === dimensions.clientWidth,
    scrollMoved: afterScroll > dimensions.before,
    flows: {
      poker: pokerResult,
      rockPaperScissors: rpsResult,
      guessThenDraw: guessResult,
    },
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

if (
  results.some(
    (result) =>
      !result.hasBrand ||
      !result.noHorizontalOverflow ||
      !result.scrollMoved ||
      result.pageErrors.length > 0,
  )
) {
  throw new Error("Entangled Shelter QA failed.");
}
