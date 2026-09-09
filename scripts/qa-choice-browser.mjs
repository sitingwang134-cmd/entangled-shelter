import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const site = process.env.SITE_URL ?? "http://127.0.0.1:3000";
const localOrigin = "http://127.0.0.1:3000";
const siteMotionKey = "entangled-shelter:motion:v1";
assert.equal(new URL(site).origin, localOrigin, "Local-independence QA must target the local production origin.");
const output = path.resolve("docs/design-references/entangled-shelter/choice-qa");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const results = [];

async function restrictToLocal(context) {
  const network = { coldCache: true, localRequests: 0, externalRequested: [] };
  // Each context is fresh, service workers are blocked, and routing disables the HTTP cache.
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (new URL(url).origin !== localOrigin) {
      network.externalRequested.push(url);
      await route.abort("blockedbyclient");
      return;
    }
    network.localRequests += 1;
    await route.continue();
  });
  return network;
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    // Full motion is unconditional even when the OS asks for less motion.
    const context = await browser.newContext({ viewport, reducedMotion: "reduce", serviceWorkers: "block" });
    const network = await restrictToLocal(context);
    // Test-only browser instrumentation; production code has no result override.
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
    await page.goto(site, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.locator('[data-active-section][data-motion="full"]').waitFor();
    assert.equal(await page.locator('[data-motion-toggle]').count(), 0, "The motion switch has been removed.");
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), siteMotionKey), null, "Default motion is tested without a saved site choice.");
    assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true, "The test must not force the OS to no-preference to obtain full motion.");
    const trigger = page.locator('[data-choice-category="food"]').first();
    await trigger.click();
    let dialog = page.locator("dialog[data-choice-lab][open]");
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute("data-motion"), "full", "The choice room uses the site's full default despite the OS preference.");
    await page.waitForTimeout(750);
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden");
    const lockedScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(650);
    assert.ok(Math.abs((await page.evaluate(() => window.scrollY)) - lockedScroll) < 2, "The page's Lenis scroll must stop while the modal is open.");
    for (let tab = 0; tab < 24; tab += 1) {
      await page.keyboard.press("Tab");
      assert.ok(await page.evaluate(() => !!document.activeElement.closest("dialog[data-choice-lab]")), "Focus must remain inside native modal.");
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true, "Return focus to entry button.");
    assert.notEqual(await page.evaluate(() => document.documentElement.style.overflow), "hidden");
    const resumedScroll = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 450);
    await page.waitForTimeout(1200);
    assert.ok((await page.evaluate(() => window.scrollY)) > resumedScroll + 40, "Lenis scrolling must resume after closing.");
    await trigger.click();
    dialog = page.locator("dialog[data-choice-lab][open]");
    assert.equal(await dialog.locator('[data-option-card]').count(), 10);
    const firstBatchNames = await dialog.locator('[data-option-card] strong').allTextContents();
    await dialog.getByRole('button', { name: '换一批' }).click();
    const secondBatchNames = await dialog.locator('[data-option-card] strong').allTextContents();
    assert.equal(new Set([...firstBatchNames, ...secondBatchNames]).size, 20);
    assert.equal(await dialog.getByLabel('已选候选').locator('li').count(), 4);
    await dialog.getByRole('button', { name: '换一批' }).click();
    const selectedOptions = dialog.locator('[aria-label="选择候选"] button[aria-pressed="true"]').filter({ has: page.locator("strong") });
    while (await selectedOptions.count()) await selectedOptions.first().click();
    assert.ok(await dialog.getByRole("button", { name: /去发牌/ }).isDisabled());
    await dialog.getByLabel("或者，写下你的候选").fill("我自己的夜宵小馆");
    await dialog.getByRole("button", { name: "加入自定义候选" }).click();
    assert.ok(await dialog.getByRole("button", { name: /去发牌/ }).isDisabled());
    await dialog.getByRole('button', { name: '全部', exact: true }).click();
    await dialog.getByRole("button", { name: /沸腾火锅.*一锅红汤/ }).click();
    assert.ok(await dialog.getByRole("button", { name: /去发牌/ }).isEnabled());
    await dialog.getByLabel("或者，写下你的候选").fill("我自己的夜宵小馆");
    await dialog.getByRole("button", { name: "加入自定义候选" }).click();
    assert.match(await dialog.getByRole("alert").innerText(), /已经在桌上/);
    await dialog.getByRole("button", { name: "关闭选择实验室" }).click();

    for (const [category, label] of [["food", "沸腾火锅"], ["style", "黑白极简"], ["travel", "山野徒步"]]) {
      await page.locator(`[data-choice-category="${category}"]`).first().click();
      dialog = page.locator("dialog[data-choice-lab][open]");
      await page.waitForTimeout(750);
      await page.screenshot({ path: path.join(output, `${viewport.width}-${category}-options.png`) });
      await dialog.getByRole("button", { name: /去发牌/ }).click();
      await dialog.getByRole("heading", { name: "先把偏爱说出来。" }).waitFor();
      assert.equal(await dialog.getByRole("button", { name: /先押一个候选/ }).isDisabled(), true);
      await dialog.getByRole("button", { name: label, exact: true }).click();
      const mode = category === "food" ? "poker" : category === "style" ? "rps" : "guess";
      await dialog.getByRole("group", { name: "选择玩法" }).getByRole("button", { name: mode === "poker" ? /命运扑克/ : mode === "rps" ? /剪刀石头布/ : /先猜后抽/ }).click();
      if (mode === "poker") {
        assert.ok(await dialog.getByRole("button", { name: /先猜红或黑/ }).isDisabled());
        await dialog.getByRole("button", { name: "红牌", exact: true }).click();
      }
      if (mode === "rps") {
        assert.ok(await dialog.getByRole("button", { name: /先选你的手势/ }).isDisabled());
        await dialog.getByRole("button", { name: "石头", exact: true }).click();
      }
      await page.evaluate((sample) => window.__choiceSamples.push(sample), mode === "poker" ? 0.75 : mode === "rps" ? 0.9 : 0.9);
      await dialog.getByRole("button", { name: /准备好了/ }).click();
      await page.waitForTimeout(200);
      assert.ok(await dialog.getByRole("button", { name: /偶然正在回答/ }).isDisabled());
      assert.equal(await dialog.getByRole("button", { name: /^就选「/ }).count(), 0);
      const midTransform = await dialog.getByTestId("choice-card").evaluate((element) => getComputedStyle(element).transform);
      assert.notEqual(midTransform, "none", "A real card transform must occur during the reveal.");
      await dialog.getByText("NOT THIS TIME / 再猜一次", { exact: true }).waitFor();
      assert.equal(await dialog.getByRole("button", { name: /^就选「/ }).count(), 0, "A failed guess cannot be accepted.");
      await dialog.getByRole("button", { name: /再来一局/ }).click();

      if (mode === "rps") {
        await page.evaluate(() => window.__choiceSamples.push(0));
        await dialog.getByRole("button", { name: /准备好了/ }).click();
        await dialog.getByText("STILL UNDECIDED / 平局", { exact: true }).waitFor();
        assert.equal(await dialog.getByRole("button", { name: /^就选「/ }).count(), 0, "A draw cannot be accepted.");
        await dialog.getByRole("button", { name: /再来一局/ }).click();
      }
      await page.evaluate((sample) => window.__choiceSamples.push(sample), mode === "rps" ? 0.4 : 0);
      await dialog.getByRole("button", { name: /准备好了/ }).click();
      await dialog.getByText(mode === "rps" ? "YOU WON / 你赢了" : "IT’S A MATCH / 猜中了", { exact: true }).waitFor();
      await dialog.getByRole("button", { name: /^就选「/ }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `${viewport.width}-${mode}-win.png`) });
      await dialog.getByRole("button", { name: /^就选「/ }).click();
      await dialog.getByText("恭喜，纠结可以到此为止了。", { exact: true }).waitFor();
      await page.waitForTimeout(750);
      await page.screenshot({ path: path.join(output, `${viewport.width}-${mode}-accepted.png`) });
      assert.equal(await page.evaluate(() => document.querySelector("dialog[data-choice-lab]").scrollWidth <= document.querySelector("dialog[data-choice-lab]").clientWidth + 1), true, "No horizontal overflow inside dialog.");
      await dialog.getByRole("button", { name: /带着答案出发/ }).click();
    }
    const history = await page.evaluate(() => JSON.parse(localStorage.getItem("entangled-shelter:decisions:v1")));
    assert.equal(history.length, 3);
    assert.deepEqual(history.map((decision) => decision.categoryId), ["travel", "style", "food"]);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("entangled-shelter:decisions:v1")).length), 3);
    assert.deepEqual(errors, []);
    assert.deepEqual(network.externalRequested, [], "The complete choice flow must not request any external network resources.");
    assert.ok(network.localRequests > 0, "The cold context must fetch the application from the local server.");
    results.push({ viewport, ...network, systemMotion: "reduce", siteMotion: "full", savedSitePreference: null, errors, assertions: "Native focus trap + return, Escape, page/Lenis scroll lock + resume, candidates, custom + duplicate, 3 modes, win/lose/tie guards, animated reveal, acceptance persistence, no horizontal overflow; full motion is the unsaved site default even under OS reduce; all paths run with external network blocked and a cold cache", history: history.map((item) => ({ category: item.categoryId, choice: item.option.name, mode: item.mode })) });
    await context.close();
  }
  const reducedContext = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce", serviceWorkers: "block" });
  const reducedNetwork = await restrictToLocal(reducedContext);
  await reducedContext.addInitScript(() => {
    const nativeRandom = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = (array) => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = 0; return array; }
      return nativeRandom(array);
    };
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "entangled-shelter:decisions:v1" || key === "entangled-shelter:motion:v1") throw new DOMException("Test: storage unavailable", "QuotaExceededError");
      return nativeSetItem.call(this, key, value);
    };
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(site, { waitUntil: "domcontentloaded" });
  await reducedPage.locator('[data-active-section][data-motion="full"]').waitFor();
  assert.equal(await reducedPage.evaluate((key) => localStorage.getItem(key), siteMotionKey), null);
  assert.equal(await reducedPage.locator('[data-motion-toggle]').count(), 0, "There is no motion switch, including when storage is unavailable.");
  assert.equal(await reducedPage.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), true);
  await reducedPage.locator('[data-choice-category="food"]').first().click();
  const reducedDialog = reducedPage.locator("dialog[data-choice-lab][open]");
  await reducedDialog.waitFor();
  assert.equal(await reducedDialog.getAttribute("data-motion"), "full", "Storage denial and OS reduce must leave complete game animations enabled.");
  await reducedDialog.getByRole("button", { name: /去发牌/ }).click();
  await reducedDialog.getByRole("button", { name: "沸腾火锅", exact: true }).click();
  await reducedDialog.getByRole("button", { name: "红牌", exact: true }).click();
  await reducedDialog.getByRole("button", { name: /准备好了/ }).click();
  await reducedPage.waitForTimeout(200);
  assert.ok(await reducedDialog.getByRole("button", { name: /偶然正在回答/ }).isDisabled());
  assert.equal(await reducedDialog.getByRole("button", { name: /^就选「/ }).count(), 0, "Acceptance must wait for the full reveal animation.");
  await reducedDialog.getByRole("button", { name: /^就选「/ }).waitFor({ state: "visible" });
  await reducedDialog.getByRole("button", { name: /^就选「/ }).click();
  await reducedDialog.getByText(/浏览器暂时无法保存记录/).waitFor();
  assert.equal(await reducedPage.evaluate(() => localStorage.getItem("entangled-shelter:decisions:v1")), null);
  await reducedPage.screenshot({ path: path.join(output, "375-full-motion-storage-fallback.png") });
  await reducedPage.waitForLoadState("networkidle");
  assert.deepEqual(reducedNetwork.externalRequested, [], "The full-motion storage fallback path must not request external resources.");
  assert.ok(reducedNetwork.localRequests > 0);
  results.push({ viewport: { width: 375, height: 812 }, ...reducedNetwork, systemMotion: "reduce", siteMotion: "full", motionTogglePresent: false, savedSitePreference: null, assertions: "Complete reveal animation remains enabled under OS reduce and storage denial; acceptance waits for the reveal, unavailable decision storage produces a clear unsaved notification without a false persistence claim; external network blocked with a cold cache." });
  await reducedContext.close();
  await fs.writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
