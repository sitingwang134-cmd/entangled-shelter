import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);
const baseUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
const siteMotionKey = "entangled-shelter:motion:v1";
const output = path.join(process.cwd(), "docs/design-references/entangled-shelter/depth-qa");
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  ...(process.env.SOFTWARE_WEBGL === "1" ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {}),
});
const result = { baseUrl, generatedAt: new Date().toISOString(), scenarios: [], errors: [] };

function trackErrors(page) {
  page.on("pageerror", (error) => result.errors.push(error.message));
}

async function ready(locator, timeout = 30_000) {
  await locator.waitFor({ state: "visible", timeout });
  await locator.page().waitForFunction(
    (element) => element?.dataset.depthReady === "true",
    await locator.elementHandle(),
    { timeout },
  );
}

async function inspect(locator) {
  return locator.evaluate((element) => {
    const poster = element.querySelector("img");
    const canvas = element.querySelector("canvas");
    const bounds = element.getBoundingClientRect();
    return {
      source: element.dataset.depthSource,
      mode: element.dataset.renderMode,
      ready: element.dataset.depthReady,
      frames: Number(element.dataset.depthFrames ?? 0),
      offset: element.dataset.depthOffset,
      progress: element.dataset.depthScroll,
      resolution: element.dataset.depthResolution,
      quality: element.dataset.depthQuality,
      posterLoaded: Boolean(poster?.complete && poster.naturalWidth > 0),
      imageSize: poster ? [poster.naturalWidth, poster.naturalHeight] : null,
      canvasSize: canvas ? [canvas.width, canvas.height] : null,
      viewSize: [Math.round(bounds.width), Math.round(bounds.height)],
      objectPosition: poster ? getComputedStyle(poster).objectPosition : null,
    };
  });
}

try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const original = window.requestAnimationFrame;
      window.depthQaFrames = 0;
      window.requestAnimationFrame = (callback) => original.call(window, (time) => {
        window.depthQaFrames += 1;
        callback(time);
      });
    });
    trackErrors(page);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const first = page.locator("[data-depth-scene]").first();
    await ready(first);
    await page.waitForTimeout(1_200);
    const neutral = await inspect(first);
    assert.equal(neutral.posterLoaded, true, "The source poster must be visible under the canvas");
    assert.ok(neutral.frames > 0, "A real shader frame must render");
    await page.screenshot({ path: path.join(output, `${viewport.name}-depth-neutral.png`) });

    await page.mouse.move(viewport.width - 30, 35);
    await page.waitForTimeout(1_400);
    const pointer = await inspect(first);
    assert.notEqual(pointer.offset, neutral.offset, "Camera must update over time/pointer input");
    await page.screenshot({ path: path.join(output, `${viewport.name}-depth-pointer.png`) });

    await page.evaluate(() => window.scrollBy({ top: 240, behavior: "instant" }));
    await page.waitForTimeout(1_100);
    const scrolled = await inspect(first);
    assert.notEqual(scrolled.progress, neutral.progress, "Camera must respond to section scroll progress");

    const sceneCount = await page.locator("[data-depth-scene]").count();
    const sweep = [];
    for (let index = 0; index < sceneCount; index += 1) {
      const scene = page.locator("[data-depth-scene]").nth(index);
      await scene.scrollIntoViewIfNeeded();
      await ready(scene);
      await page.waitForTimeout(500);
      const current = await inspect(scene);
      assert.equal(current.posterLoaded, true, `Scene ${index} source must load`);
      const contexts = await page.locator("[data-depth-scene] canvas").count();
      assert.ok(contexts <= 3, `GPU pool exceeded: ${contexts} contexts`);
      sweep.push({ index, contexts, ...current });
      // The art deliberately overscans and may be transformed larger than the
      // viewport. Capture what a visitor sees, not an out-of-bounds locator
      // rectangle that Chromium pads with black beyond the browser viewport.
      await page.screenshot({ path: path.join(output, `${viewport.name}-scene-${index}.png`) });
    }

    let poolStress = null;
    if ((await page.title()) === "DepthScene render harness") {
      const grid = await page.addStyleTag({ content: "#fixture{display:grid;grid-template-columns:repeat(3,1fr)}section,.painting{height:30vh!important}" });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(1_000);
      poolStress = await page.locator("[data-depth-scene] canvas").count();
      assert.equal(poolStress, 3, "Nine visible scenes must share exactly three GPU slots");
      await grid.evaluate((element) => element.remove());
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await ready(first);
    await first.locator("canvas").evaluate((canvas) => {
      canvas.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext();
    });
    await page.waitForTimeout(250);
    const lost = await inspect(first);
    assert.equal(lost.posterLoaded, true, "Context loss must leave the original image visible");
    await ready(first, 15_000);
    const recovered = await inspect(first);
    assert.equal(recovered.mode, "webgl", "Lost GPU context must recover with a fresh canvas");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(200);
    await ready(first);
    const osReduced = await inspect(first);
    assert.equal(osReduced.mode, "webgl", "OS reduction must not disable the full-motion renderer.");
    assert.ok(await first.locator("canvas").count() > 0);
    assert.equal(await page.locator('[data-motion-toggle]').count(), 0, "The motion switch has been removed.");
    await page.screenshot({ path: path.join(output, `${viewport.name}-os-reduce-full-motion.png`) });
    await page.evaluate((key) => localStorage.setItem(key, "reduced"), siteMotionKey);
    await page.reload({ waitUntil: "domcontentloaded" });
    await ready(first);
    const legacyReduced = await inspect(first);
    assert.equal(legacyReduced.mode, "webgl", "A legacy saved reduced value must not disable the renderer.");
    assert.ok(await first.locator("canvas").count() > 0);
    assert.equal(await page.locator('[data-motion-toggle]').count(), 0);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), siteMotionKey), "reduced", "Legacy preferences are ignored, not deleted.");
    assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
    await page.screenshot({ path: path.join(output, `${viewport.name}-legacy-reduced-ignored-full.png`) });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await ready(first);
    let unmount = null;
    if ((await page.title()) === "DepthScene render harness") {
      await page.evaluate(() => window.unmountDepthFixture());
      await page.waitForTimeout(200);
      const before = await page.evaluate(() => window.depthQaFrames);
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => window.depthQaFrames);
      unmount = { canvases: await page.locator("canvas").count(), subsequentFrames: after - before };
      assert.equal(unmount.canvases, 0, "Unmount must remove every canvas");
      assert.equal(unmount.subsequentFrames, 0, "Unmount must stop the shared RAF scheduler");
    }
    result.scenarios.push({ viewport: viewport.name, neutral, pointer, scrolled, sweep, poolStress, lost, recovered, osReduced, legacyReduced, motionTogglePresent: false, legacyPreferenceIgnored: true, unmount });
    await context.close();
  }

  const fallbackContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const fallbackPage = await fallbackContext.newPage();
  trackErrors(fallbackPage);
  await fallbackPage.route("**/*-depth.png", (route) => route.abort());
  await fallbackPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const fallbackScene = fallbackPage.locator("[data-depth-scene]").first();
  await fallbackPage.waitForFunction(() => document.querySelector("[data-depth-scene]")?.getAttribute("data-render-mode") === "fallback");
  const fallback = await inspect(fallbackScene);
  assert.equal(fallback.posterLoaded, true, "Missing depth must not hide the source image");
  assert.equal(await fallbackScene.locator("canvas").count(), 0);
  await fallbackPage.screenshot({ path: path.join(output, "desktop-depth-failure-fallback.png") });
  result.scenarios.push({ viewport: "fallback", ...fallback });
  await fallbackContext.close();
  assert.deepEqual(result.errors, [], "No browser runtime errors are allowed");
  result.passed = true;
} catch (error) {
  result.passed = false;
  result.failure = error instanceof Error ? error.stack : String(error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(output, "results.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

