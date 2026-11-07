import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const site = process.env.SITE_URL ?? "http://127.0.0.1:3000";
const output = path.resolve("docs/design-references/entangled-shelter/choice-qa");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const results = [];

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
    await context.addInitScript(() => {
      const native = crypto.getRandomValues.bind(crypto);
      window.__choiceSamples = [];
      crypto.getRandomValues = (array) => {
        if (array instanceof Uint32Array && array.length === 1 && window.__choiceSamples.length) {
          array[0] = Math.floor(window.__choiceSamples.shift() * 0x100000000);
          return array;
        }
        return native(array);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(site, { waitUntil: "networkidle", timeout: 60_000 });
    await page.locator('[data-active-section][data-motion="full"]').waitFor();

    const slider = page.getByRole("slider", { name: "Royal window shade" });
    await slider.scrollIntoViewIfNeeded();
    await slider.press("End");
    assert.equal(await slider.getAttribute("aria-valuenow"), "0");
    await slider.press("Home");
    assert.equal(await slider.getAttribute("aria-valuenow"), "100");
    await page.screenshot({ path: path.join(output, `${viewport.width}-travel-porthole.png`), fullPage: false });

    const trigger = page.locator('[data-choice-category="food"]').first();
    await trigger.click();
    const dialog = page.locator("dialog[data-choice-lab][open]");
    await dialog.waitFor();
    assert.equal(await dialog.locator('[data-option-card]').count(), 10);
    const first = await dialog.locator('[data-option-card] strong').allTextContents();
    await dialog.getByRole("button", { name: "ANOTHER EDIT" }).click();
    const second = await dialog.locator('[data-option-card] strong').allTextContents();
    assert.equal(new Set([...first, ...second]).size, 20);
    await dialog.getByRole("button", { name: /PLAY THE ROUND/ }).click();
    await dialog.getByRole("heading", { name: "Name your desire first." }).waitFor();
    await dialog.locator('fieldset').filter({ hasText: "Where will you place your wager?" }).getByRole("button").first().click();
    await dialog.getByRole("button", { name: "Red card" }).click();
    await page.evaluate(() => window.__choiceSamples.push(0));
    await dialog.getByRole("button", { name: /TURN THE CARD OF FATE/ }).click();
    await dialog.getByText("IT’S A MATCH", { exact: true }).waitFor();
    await dialog.getByRole("button", { name: /^CHOOSE/ }).click();
    await dialog.getByText("Beautiful. Indecision may end here.", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, `${viewport.width}-accepted.png`), fullPage: false });
    await dialog.getByRole("button", { name: /GO WITH THE ANSWER/ }).click();

    await page.goto(`${site}/history`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.getByRole("heading", { name: /A cabinet of/ }).waitFor();
    assert.equal(await page.locator("iframe").count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
    await page.screenshot({ path: path.join(output, `${viewport.width}-archive.png`), fullPage: true });
    assert.deepEqual(errors, []);
    results.push({ viewport, options: 20, portholeKeyboard: true, acceptedDecision: true, archive: true, errors });
    await context.close();
  }
  await fs.writeFile(path.join(output, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}

