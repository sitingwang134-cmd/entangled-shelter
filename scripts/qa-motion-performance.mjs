import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const runFile = promisify(execFile);
const baseUrl = process.env.SITE_URL ?? "http://127.0.0.1:3000";
const output = path.join(process.cwd(), "docs/design-references/entangled-shelter/motion-qa");
const argumentsSet = new Set(process.argv.slice(2));
const runPerformance = !argumentsSet.has("--video-only");
const runVideo = !argumentsSet.has("--performance-only");
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
await fs.mkdir(output, { recursive: true });
const sourceHashes = {};
for (const file of ["src/components/entangled/EntangledShelter.tsx", "src/components/entangled/EntangledShelter.module.css", "src/components/entangled/DepthScene.tsx", "src/components/entangled/DepthScene.module.css", "public/entangled/media-manifest.json", "package.json"]) {
  sourceHashes[file] = createHash("sha256").update(await fs.readFile(path.join(process.cwd(), file))).digest("hex");
}
const buildId = await fs.readFile(path.join(process.cwd(), ".next/BUILD_ID"), "utf8").then((value) => value.trim()).catch(() => null);

function summarize(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    count: values.length,
    meanMs: Number(mean.toFixed(3)),
    medianMs: Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(3)),
    p95Ms: Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))].toFixed(3)),
    p99Ms: Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))].toFixed(3)),
    maximumMs: Number(sorted.at(-1).toFixed(3)),
    derivedMeanHz: Number((1_000 / mean).toFixed(2)),
    intervalsOver25Ms: values.filter((value) => value > 25).length,
    intervalsOver33Ms: values.filter((value) => value > 33.34).length,
    intervalsOver50Ms: values.filter((value) => value > 50).length,
  };
}

function intervals(timestamps) {
  return timestamps.slice(1).map((time, index) => time - timestamps[index]);
}

async function visibleScenes(page) {
  return page.locator("[data-depth-scene]").evaluateAll((elements) => elements.map((element) => {
    const bounds = element.getBoundingClientRect();
    const image = element.querySelector("img");
    const canvas = element.querySelector("canvas");
    return {
      source: element.dataset.depthSource,
      ready: element.dataset.depthReady,
      mode: element.dataset.renderMode,
      frames: Number(element.dataset.depthFrames ?? 0),
      quality: element.dataset.depthQuality,
      resolution: element.dataset.depthResolution,
      visibleArea: Math.max(0, Math.min(innerWidth, bounds.right) - Math.max(0, bounds.left)) * Math.max(0, Math.min(innerHeight, bounds.bottom) - Math.max(0, bounds.top)),
      posterLoaded: Boolean(image?.complete && image.naturalWidth),
      canvas: Boolean(canvas),
    };
  }).filter((scene) => scene.visibleArea > 0));
}

async function waitForArt(page, source) {
  try {
    await page.waitForFunction((value) => {
      const element = document.querySelector(`[data-depth-source="/entangled/${value}.webp"]`);
      return element?.getAttribute("data-depth-ready") === "true";
    }, source, { timeout: 30_000 });
  } catch (error) {
    await page.screenshot({ path: path.join(output, `failure-${source}.png`) });
    await fs.writeFile(path.join(output, `failure-${source}.json`), JSON.stringify({ source, scrollY: await page.evaluate(() => scrollY), visible: await visibleScenes(page) }, null, 2));
    throw error;
  }
}

async function settleScroll(page) {
  let previous = await page.evaluate(() => window.scrollY);
  let stable = 0;
  for (let attempt = 0; attempt < 50 && stable < 3; attempt += 1) {
    await page.waitForTimeout(100);
    const current = await page.evaluate(() => window.scrollY);
    stable = Math.abs(current - previous) < 0.5 ? stable + 1 : 0;
    previous = current;
  }
}

async function moveTo(page, selector, offset = 0) {
  // Navigate through the same wheel input as a visitor. Native scrollTo and
  // CDP scrollIntoView can be pulled back by an existing Lenis smooth target,
  // even when integer scrollY appears stable; neither is used for this benchmark.
  await settleScroll(page);
  const target = await page.locator(selector).evaluate((element, amount) => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, scrollY + element.getBoundingClientRect().top + amount)), offset);
  const navigationTrace = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const current = await page.evaluate(() => scrollY);
    navigationTrace.push({ attempt, target, current, requestedDelta: target - current });
    if (Math.abs(current - target) < 16) break;
    const viewport = page.viewportSize();
    await page.mouse.move(viewport.width * 0.5, viewport.height * 0.55);
    await page.mouse.wheel(0, target - current);
    await settleScroll(page);
  }
  const reached = await page.evaluate(() => scrollY);
  console.log(JSON.stringify({ navigation: selector, viewport: page.viewportSize(), trace: navigationTrace, reached }));
  assert.ok(Math.abs(reached - target) < 60, `Wheel navigation missed ${selector}: target ${target}, actual ${reached}`);
  await page.waitForTimeout(600);
}

// Installed before application code. This observes actual draw dispatches and
// one native RAF clock; it does not change the website scheduler or its cadence.
function installMeasurement() {
  let capture = null;
  let nextCanvasId = 0;
  const canvasIds = new WeakMap();
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const originalDraw = WebGLRenderingContext.prototype.drawArrays;
  const gpuByCanvas = new WeakMap();

  WebGLRenderingContext.prototype.drawArrays = function (...args) {
    const sample = capture;
    if (!sample) return originalDraw.apply(this, args);
    const canvas = this.canvas;
    if (!canvasIds.has(canvas)) canvasIds.set(canvas, ++nextCanvasId);
    const id = canvasIds.get(canvas);
    if (!sample.canvases[id]) {
      if (!gpuByCanvas.has(canvas)) {
        const debug = this.getExtension("WEBGL_debug_renderer_info");
        gpuByCanvas.set(canvas, {
          vendor: debug ? this.getParameter(debug.UNMASKED_VENDOR_WEBGL) : this.getParameter(this.VENDOR),
          renderer: debug ? this.getParameter(debug.UNMASKED_RENDERER_WEBGL) : this.getParameter(this.RENDERER),
          version: this.getParameter(this.VERSION),
        });
      }
      sample.canvases[id] = {
        id,
        source: canvas.closest("[data-depth-scene]")?.dataset.depthSource,
        gpu: gpuByCanvas.get(canvas),
        timestamps: [],
        dispatchCpuMs: [],
      };
    }
    const start = performance.now();
    sample.canvases[id].timestamps.push(start);
    const result = originalDraw.apply(this, args);
    sample.canvases[id].dispatchCpuMs.push(performance.now() - start);
    return result;
  };

  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
    new PerformanceObserver((list) => {
      if (capture) capture.longTasks.push(...list.getEntries().map((entry) => ({ start: entry.startTime, duration: entry.duration })));
    }).observe({ type: "longtask" });
  }
  window.beginMotionSample = (name) => {
    capture = { name, start: performance.now(), startY: window.scrollY, raf: [], canvases: {}, longTasks: [] };
    const sample = capture;
    const tick = (time) => {
      if (capture !== sample) return;
      sample.raf.push(time);
      nativeRaf(tick);
    };
    nativeRaf(tick);
  };
  window.finishMotionSample = () => {
    const sample = capture;
    capture = null;
    return { ...sample, end: performance.now(), endY: window.scrollY };
  };
}

async function sampleMotion(page, name, duration, motion = "idle", totalWheel = 0) {
  const before = await visibleScenes(page);
  await page.evaluate((label) => window.beginMotionSample(label), name);
  const start = Date.now();
  let previousAmount = 0;
  while (Date.now() - start < duration) {
    const progress = Math.min(1, (Date.now() - start) / duration);
    const size = page.viewportSize();
    if (motion === "pointer") {
      await page.mouse.move(size.width * (0.5 + Math.sin(progress * Math.PI * 2) * 0.43), size.height * (0.5 + Math.cos(progress * Math.PI * 2) * 0.35));
    } else if (motion === "scroll") {
      const desiredAmount = totalWheel * progress;
      await page.mouse.wheel(0, desiredAmount - previousAmount);
      previousAmount = desiredAmount;
    }
    await page.waitForTimeout(90);
  }
  const raw = await page.evaluate(() => window.finishMotionSample());
  const after = await visibleScenes(page);
  raw.visibleBefore = before;
  raw.visibleAfter = after;
  raw.buildId = buildId;
  raw.sourceHashes = sourceHashes;
  await fs.writeFile(path.join(output, `${name}-raw.json`), JSON.stringify(raw));
  await page.screenshot({ path: path.join(output, `${name}-end.png`) });
  return summarizeCapture(raw);
}

function summarizeCapture(raw) {
  const renderers = Object.values(raw.canvases).map((canvas) => {
    const dispatch = summarize(intervals(canvas.timestamps));
    return {
      id: canvas.id,
      source: canvas.source,
      gpu: canvas.gpu,
      actualDrawCalls: canvas.timestamps.length,
      drawIntervals: dispatch,
      dispatchCpuCost: summarize(canvas.dispatchCpuMs),
      below60HzTarget: dispatch && dispatch.count >= 30 ? dispatch.derivedMeanHz < 55 || dispatch.p95Ms > 25 : null,
    };
  });
  return {
    name: raw.name,
    recordingEnabled: false,
    durationMs: Number((raw.end - raw.start).toFixed(2)),
    nativeRaf: summarize(intervals(raw.raf)),
    startY: raw.startY,
    endY: raw.endY,
    visibleBefore: raw.visibleBefore ?? null,
    visibleAfter: raw.visibleAfter ?? null,
    renderers,
    longTasks: raw.longTasks,
  };
}

async function performancePass(browser) {
  const report = {
    generatedAt: new Date().toISOString(), baseUrl, browserVersion: browser.version(), buildId, sourceHashes,
    methodology: "Unrecorded production-site samples. Native RAF and actual WebGL drawArrays dispatch timestamps are observed without changing the 60 Hz depth scheduler. Dispatch timing is not GPU completion or physical display presentation. Warm-up and chapter navigation are excluded, except the named transition sample. No CPU/network throttling and no forced software renderer.",
    limitations: "Headless Edge on this machine; mobile viewport is emulation, not a physical phone. Other workloads and desktop refresh configuration can affect results. Video is captured in a separate browser context after the benchmark and cannot establish 60 fps presentation.",
    target: "Depth layer target = 60 draws/second. below60HzTarget flags samples with at least 30 intervals and mean below 55 Hz or p95 above 25 ms. Numeric results remain authoritative; a passing functional test is not substituted for frame rate.",
    scenarios: [], errors: [],
  };
  const requestedViewport = [...argumentsSet].find((value) => value.startsWith("--viewport="))?.split("=")[1];
  if (argumentsSet.has("--reuse-desktop-raw")) {
    report.recoveredDesktop = "Five successful desktop samples from the same frozen production build were preserved when later mobile navigation failed. Legacy raw files contain actual RAF/draw timestamps and GPU identity, but not the DOM before/after snapshots; those fields are explicitly null. Source hashes in this aggregate are observed at aggregation time.";
    for (const name of ["hero-idle", "hero-pointer", "food-scroll", "style-multiscene", "travel-to-ritual"]) {
      const file = path.join(output, `desktop-${name}-raw.json`);
      const raw = JSON.parse(await fs.readFile(file, "utf8"));
      const stat = await fs.stat(file);
      report.scenarios.push({ viewport: { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false }, rawSavedAt: stat.mtime.toISOString(), ...summarizeCapture(raw) });
    }
  }
  try {
    const cdp = await browser.newBrowserCDPSession();
    const info = await cdp.send("SystemInfo.getInfo");
    report.systemGpu = { devices: info.gpu.devices, featureStatus: info.gpu.featureStatus, driverBugWorkarounds: info.gpu.driverBugWorkarounds };
    await cdp.detach();
  } catch (error) {
    report.systemGpuUnavailable = error.message;
  }

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  ]) {
    if (requestedViewport && requestedViewport !== viewport.name) continue;
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.deviceScaleFactor, isMobile: viewport.isMobile, hasTouch: viewport.hasTouch, reducedMotion: "no-preference" });
    await context.addInitScript(installMeasurement);
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await waitForArt(page, "station");
    await page.waitForTimeout(2_000);
    report.scenarios.push({ viewport, ...await sampleMotion(page, `${viewport.name}-hero-idle`, 4_000) });
    report.scenarios.push({ viewport, ...await sampleMotion(page, `${viewport.name}-hero-${viewport.isMobile ? "breathing" : "pointer"}`, 5_000, viewport.isMobile ? "idle" : "pointer") });
    await moveTo(page, "#food", viewport.height * 0.16);
    await waitForArt(page, "room");
    report.scenarios.push({ viewport, ...await sampleMotion(page, `${viewport.name}-food-scroll`, 5_000, "scroll", viewport.height * 0.6) });
    await moveTo(page, "#style", viewport.height * 1.05);
    await waitForArt(page, "atelier");
    await page.waitForTimeout(1_400);
    report.scenarios.push({ viewport, ...await sampleMotion(page, `${viewport.name}-style-multiscene`, 5_000, "scroll", viewport.height * 0.3) });
    await moveTo(page, "#ritual", -viewport.height * 0.8);
    report.scenarios.push({ viewport, ...await sampleMotion(page, `${viewport.name}-travel-to-ritual`, 5_000, "scroll", viewport.height * 1.3) });
    await context.close();
    console.log(`Measured ${viewport.name}: five unrecorded scenarios`);
  }
  report.functionalErrorsAbsent = report.errors.length === 0;
  report.belowTargetSamples = report.scenarios.filter((scenario) => scenario.renderers.some((renderer) => renderer.below60HzTarget)).map((scenario) => scenario.name);
  report.softwareRendererObserved = report.scenarios.some((scenario) => scenario.renderers.some((renderer) => /swiftshader|software|llvmpipe/i.test(renderer.gpu.renderer)));
  await fs.writeFile(path.join(output, "performance-results.json"), JSON.stringify(report, null, 2));
  const rows = report.scenarios.flatMap((scenario) => scenario.renderers.filter((renderer) => renderer.actualDrawCalls >= 30).map((renderer) => `| ${scenario.name} | ${path.basename(renderer.source)} | ${renderer.actualDrawCalls} | ${renderer.drawIntervals.meanMs} | ${renderer.drawIntervals.p95Ms} | ${renderer.drawIntervals.derivedMeanHz} | ${renderer.below60HzTarget ? "Below target in this run" : "Within stated sampling tolerance"} |`));
  const markdown = `# Motion performance evidence\n\n${report.methodology}\n\n${report.limitations}\n\nBrowser: ${report.browserVersion}. Generated: ${report.generatedAt}. Software renderer observed: ${report.softwareRendererObserved}.\n\n${report.target}\n\n| Scenario | Painting | Actual draws | Mean interval ms | p95 interval ms | Mean Hz | Observation |\n| --- | --- | ---: | ---: | ---: | ---: | --- |\n${rows.join("\n")}\n\nNative RAF statistics, GPU model/driver, long tasks, visible scene counters, and raw dispatch timestamps are in the JSON files alongside this report.\n\nRuntime errors: ${report.errors.length}. Below-target samples: ${report.belowTargetSamples.join(", ") || "none observed in these samples"}.\n`;
  const retainedHero = report.scenarios.some((scenario) => !scenario.name.includes("hero") && scenario.renderers.some((renderer) => renderer.source === "/entangled/station.webp" && renderer.actualDrawCalls >= 30));
  const evidenceNotes = `\n## Evidence boundaries\n\n${report.recoveredDesktop ?? "All samples were collected during this invocation."}\n\n${retainedHero ? "Ongoing hero draw calls were observed in some desktop chapter samples alongside the current chapter/card. The actual active-renderer peak can be 3; a depth sweep observing only 2 does not establish a universal two-renderer maximum. These observations do not prove that every offscreen or covered scene stops on every navigation path." : "No retained hero draw calls were observed in these chapter samples; this is not a universal lifecycle guarantee."}\n\nThe separately recorded video is visual evidence, not proof of 60 fps physical display presentation.\n`;
  await fs.writeFile(path.join(output, "PERFORMANCE.md"), markdown + evidenceNotes);
  assert.deepEqual(report.errors, [], "No application runtime errors allowed in measured scenarios");
  return report;
}

async function videoPass(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", recordVideo: { dir: path.join(output, "raw-video"), size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const video = page.video();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await waitForArt(page, "station");
  const timeline = [];
  const start = Date.now();
  for (const step of [
    { id: "top", duration: 2_700, offset: 0 },
    { id: "food", duration: 4_000, offset: 450 },
    { id: "style", duration: 4_000, offset: 400 },
    { id: "travel", duration: 4_000, offset: 400 },
    { id: "ritual", duration: 4_000, offset: 150 },
    { id: "ending", duration: 4_000, offset: 0 },
  ]) {
    const target = await page.locator(`#${step.id}`).evaluate((element, offset) => window.scrollY + element.getBoundingClientRect().top + offset, step.offset);
    const beginning = await page.evaluate(() => window.scrollY);
    const partStart = Date.now();
    let previous = beginning;
    while (Date.now() - partStart < step.duration) {
      const progress = Math.min(1, (Date.now() - partStart) / step.duration);
      const eased = progress * progress * (3 - 2 * progress);
      const desired = beginning + (target - beginning) * eased;
      await page.mouse.move(720 + Math.sin((Date.now() - start) / 1_900) * 540, 440 + Math.cos((Date.now() - start) / 1_500) * 270);
      if (Math.abs(desired - previous) > 0.5) await page.mouse.wheel(0, desired - previous);
      previous = desired;
      await page.waitForTimeout(80);
    }
    timeline.push({ section: step.id, elapsedMs: Date.now() - start, scrollY: await page.evaluate(() => window.scrollY), scenes: await visibleScenes(page) });
    await page.screenshot({ path: path.join(output, `video-${step.id}.png`) });
  }
  await context.close();
  const destination = path.join(output, "motion-desktop.webm");
  await video.saveAs(destination);
  const probe = await runFile("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate", "-of", "json", destination]);
  const metadata = JSON.parse(probe.stdout);
  const black = await runFile("ffmpeg", ["-hide_banner", "-i", destination, "-vf", "blackdetect=d=0.03:pix_th=0.06:pic_th=0.98", "-an", "-f", "null", "-"], { maxBuffer: 8 * 1024 * 1024 });
  const blackEvents = black.stderr.split(/\r?\n/).filter((line) => line.includes("black_start:"));
  await runFile("ffmpeg", ["-y", "-hide_banner", "-i", destination, "-vf", "fps=1/2,scale=480:-1,tile=4x3", "-frames:v", "1", path.join(output, "motion-contact-sheet.jpg")], { maxBuffer: 8 * 1024 * 1024 });
  const result = { baseUrl, generatedAt: new Date().toISOString(), buildId, sourceHashes, video: destination, metadata, timeline, blackEvents, errors, note: "Separate visual recording, not a performance sample. Blackdetect only flags nearly full-black frames, not all edge artifacts; screenshots/contact sheet require visual review. The recording frame rate is unrelated to the live 60 Hz shader target." };
  await fs.writeFile(path.join(output, "video-results.json"), JSON.stringify(result, null, 2));
  assert.deepEqual(errors, [], "No runtime errors during recorded scroll tour");
  console.log(`Recorded scroll tour: ${destination}; black events: ${blackEvents.length}`);
  return result;
}

const browser = await chromium.launch({ executablePath: edge, headless: true });
try {
  if (runPerformance) await performancePass(browser);
  if (runVideo) await videoPass(browser);
} catch (error) {
  await fs.writeFile(path.join(output, "last-run-failure.json"), JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, modes: [...argumentsSet], error: error.stack ?? error.message }, null, 2));
  throw error;
} finally {
  await browser.close();
}
