import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const url = process.env.SITE_URL || "http://127.0.0.1:3000";
const siteMotionKey = "entangled-shelter:motion:v1";
const output = path.resolve("docs/design-references/entangled-shelter/page-qa");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const results = [];
const widths = process.env.QA_WIDTHS ? process.env.QA_WIDTHS.split(",").map(Number) : process.env.QA_QUICK ? [1440,390] : [1440,390,640,768,939,940,1920,360];
try {
  for (const width of widths) {
    const height = width <= 640 ? 844 : 900;
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    const failed = [];
    const external = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400) failed.push([response.url(), response.status()]); });
    page.on("request", (request) => { if (request.url().startsWith("http") && new URL(request.url()).origin !== new URL(url).origin) external.push(request.url()); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-active-section][data-motion="full"]').waitFor();
    assert.equal(await page.locator('[data-motion-toggle]').count(), 0, "The motion switch has been removed.");
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), siteMotionKey), null, "A fresh visitor receives full motion without a saved override.");
    assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true, "Default full motion must work without changing the OS preference.");
    await page.locator("#top [data-depth-ready='true']").waitFor({ state: "attached", timeout: 20000 });
    await page.waitForTimeout(2200);
    assert.match(await page.title(), /Entangled Shelter/);
    assert.equal(await page.locator("h1").innerText(), "Entangled\nShelter");
    await page.screenshot({ path: path.join(output, `${width}-hero.png`) });
    const before = await page.locator("[data-hero-image]").evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(1800);
    const after = await page.locator("[data-hero-image]").evaluate((el) => getComputedStyle(el).transform);
    assert.notEqual(before, after, "hero camera follows scroll");
    assert.ok(await page.evaluate(() => window.scrollY) > 400, "wheel scroll moved");
    await page.screenshot({ path: path.join(output, `${width}-hero-motion.png`) });
    const steps = [];
    for (const id of ["intro", "food", "style", "travel", "ritual", "ending"]) {
      await page.locator(`#${id}`).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + (el.id === "intro" || el.id === "ending" ? 0 : 120)));
      await page.waitForTimeout(1700);
      await page.screenshot({ path: path.join(output, `${width}-${id}.png`) });
      const state = await page.evaluate(() => ({
        active: document.querySelector("[data-active-section]").dataset.activeSection,
        theme: document.querySelector("[data-active-section]").dataset.theme,
        scrollWidth: document.documentElement.scrollWidth,
        width: document.documentElement.clientWidth,
      }));
      assert.equal(state.active, id, `${width} active section ${id}`);
      assert.equal(state.theme, id === "intro" || id === "ritual" ? "light" : "dark");
      assert.ok(state.scrollWidth <= state.width + 1, `${width}/${id}: no horizontal overflow (${state.scrollWidth})`);
      steps.push({ id, ...state });
      if (["food","style","travel"].includes(id)) {
        const headingTransform = await page.locator(`#${id} [data-chapter-title]`).evaluate((el) => getComputedStyle(el).transform);
        await page.mouse.wheel(0, height * .85);
        await page.waitForTimeout(1500);
        assert.notEqual(await page.locator(`#${id} [data-chapter-title]`).evaluate((el) => getComputedStyle(el).transform), headingTransform);
        await page.screenshot({ path: path.join(output, `${width}-${id}-cards.png`) });
      }
    }
    if (width < 641) {
      await page.getByRole("button", { name: "打开菜单", exact: true }).click();
      await page.getByRole("navigation", { name: "章节菜单" }).getByRole("link", { name: /美食/ }).click();
      await page.waitForTimeout(1800);
      assert.equal(await page.locator("[data-active-section]").getAttribute("data-active-section"), "food", "mobile menu navigates");
    } else {
      await page.getByRole("navigation", { name: "主要导航" }).getByRole("link", { name: "穿搭", exact: true }).click();
      await page.waitForTimeout(1800);
      assert.equal(await page.locator("[data-active-section]").getAttribute("data-active-section"), "style", "desktop anchor navigates");
    }
    const localImages = await page.locator("main img").evaluateAll((images) => images.map((image) => ({ src: image.getAttribute("src"), loaded: image.complete && image.naturalWidth > 0 })));
    assert.equal(localImages.length, 9);
    assert.ok(localImages.every((image) => image.loaded));
    assert.equal(new Set(localImages.map((image) => image.src)).size, 9, "all 9 supplied artworks used");
    assert.equal(external.length, 0, "independent site has no external runtime or media requests");
    assert.equal(failed.length, 0, "all local assets loaded");
    assert.equal(errors.length, 0, "no runtime exceptions");
    results.push({ width, height, steps, localImages, external, failed, errors, scrollAnimation: true, systemMotion: "reduce", siteMotion: "full", savedSitePreference: null });
    await context.close();
    console.log(`Page QA passed at ${width}px`);
  }
  const reduced = await browser.newContext({ viewport: {width:390,height:844}, reducedMotion:"reduce" });
  const page = await reduced.newPage();
  const policyErrors = [];
  page.on("pageerror", (error) => policyErrors.push(error.message));
  await page.goto(url, {waitUntil:"networkidle"});
  const initialPreference = await page.evaluate((key) => localStorage.getItem(key), siteMotionKey);
  assert.equal(initialPreference, null, "OS reduce is tested with no saved site setting.");
  assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
  await page.locator('[data-active-section][data-motion="full"]').waitFor();
  await page.locator('#top [data-depth-ready="true"]').waitFor({ state: "attached", timeout: 20000 });
  const defaultCanvasCount = await page.locator("#top canvas").count();
  assert.ok(defaultCanvasCount > 0, "OS reduce alone must not remove the default full-motion canvas.");
  await page.waitForTimeout(2200);
  const opacity = await page.locator("[data-hero-title]").evaluate((el) => getComputedStyle(el).opacity);
  assert.equal(opacity, "1");
  await page.screenshot({path:path.join(output,"390-os-reduce-default-full.png")});

  assert.equal(await page.locator('[data-motion-toggle]').count(), 0, "No visitor motion switch is rendered.");
  await page.evaluate((key) => localStorage.setItem(key, "reduced"), siteMotionKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-active-section][data-motion="full"]').waitFor();
  await page.locator('#top [data-depth-ready="true"]').waitFor({ state: "attached", timeout: 20000 });
  const legacyCanvasCount = await page.locator("#top canvas").count();
  assert.ok(legacyCanvasCount > 0, "A legacy reduced preference must not disable the renderer.");
  assert.equal(await page.locator('[data-motion-toggle]').count(), 0);
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), siteMotionKey), "reduced", "Legacy storage is ignored without deleting the saved value.");
  assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true, "The site must leave the OS preference unchanged.");
  await page.waitForTimeout(2200);
  assert.equal(await page.locator("[data-hero-title]").evaluate((el) => getComputedStyle(el).opacity), "1");
  await page.screenshot({path:path.join(output,"390-legacy-reduced-ignored-full.png")});
  assert.deepEqual(policyErrors, [], "No runtime errors with OS reduction or a legacy saved reduced preference.");
  const motionPolicy = { systemMotion: "reduce", initialPreference, siteMotion: "full", defaultCanvasCount, motionTogglePresent: false, legacySavedPreference: "reduced", legacyPreferenceIgnored: true, legacyPreferencePreserved: true, legacyCanvasCount, errors: policyErrors };
  await reduced.close();
  await fs.writeFile(path.join(output,process.env.QA_RESULT_NAME || "results.json"),JSON.stringify({generatedAt:new Date().toISOString(),url,motionPolicy,results},null,2));
} finally { await browser.close(); }
