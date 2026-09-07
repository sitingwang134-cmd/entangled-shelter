import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const root = process.cwd();
const sourceUrl = "https://www.shopify.com/editions/winter2026";
const researchRoot = path.join(
  root,
  "docs/research/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c",
);
const screenshotRoot = path.join(
  root,
  "docs/design-references/www-shopify-com-a6fbc09c/editions-winter2026-e4a4040c",
);

await mkdir(researchRoot, { recursive: true });
await mkdir(screenshotRoot, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ],
});

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900, primary: true },
  { name: "tablet-768", width: 768, height: 1024, primary: false },
  { name: "mobile-390", width: 390, height: 844, primary: false },
];

const allResults = {};

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
    locale: "en-US",
    colorScheme: "light",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(8_000);

  const scrollMetrics = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    width: document.documentElement.scrollWidth,
    viewportHeight: innerHeight,
    viewportWidth: innerWidth,
  }));

  for (let y = 0; y <= scrollMetrics.height; y += Math.max(620, viewport.height * 0.8)) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(110);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1_500);

  await page.screenshot({
    path: path.join(screenshotRoot, `${viewport.name}-full.png`),
    fullPage: true,
    animations: "allow",
    timeout: 120_000,
  });
  await page.screenshot({
    path: path.join(screenshotRoot, `${viewport.name}-hero.png`),
    fullPage: false,
    animations: "allow",
    timeout: 30_000,
  });

  const extraction = await page.evaluate(() => {
    const properties = [
      "fontSize",
      "fontWeight",
      "fontFamily",
      "lineHeight",
      "letterSpacing",
      "color",
      "textTransform",
      "textDecoration",
      "backgroundColor",
      "backgroundImage",
      "padding",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "margin",
      "marginTop",
      "marginRight",
      "marginBottom",
      "marginLeft",
      "width",
      "height",
      "maxWidth",
      "minWidth",
      "maxHeight",
      "minHeight",
      "display",
      "flexDirection",
      "justifyContent",
      "alignItems",
      "gap",
      "gridTemplateColumns",
      "gridTemplateRows",
      "borderRadius",
      "border",
      "boxShadow",
      "overflow",
      "overflowX",
      "overflowY",
      "position",
      "top",
      "right",
      "bottom",
      "left",
      "zIndex",
      "opacity",
      "transform",
      "transition",
      "animation",
      "cursor",
      "objectFit",
      "objectPosition",
      "mixBlendMode",
      "filter",
      "backdropFilter",
      "whiteSpace",
      "textOverflow",
    ];

    function styles(element) {
      const computed = getComputedStyle(element);
      return Object.fromEntries(
        properties
          .map((property) => [property, computed[property]])
          .filter(([, value]) => value && value !== "normal" && value !== "auto"),
      );
    }

    function describe(element) {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        classes: typeof element.className === "string" ? element.className : null,
        text: element.innerText?.trim().slice(0, 1200) || null,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y + scrollY),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        styles: styles(element),
      };
    }

    const sectionCandidates = [
      ...document.querySelectorAll(
        "main > *, main section, [id='main-content'] > *, section[id], article[id]",
      ),
    ];
    const seen = new Set();
    const sections = sectionCandidates
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width < innerWidth * 0.45 || rect.height < 180) return false;
        const key = `${element.tagName}:${element.id}:${Math.round(rect.top + scrollY)}:${Math.round(rect.height)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((element, index) => ({
        index,
        ...describe(element),
        headings: [...element.querySelectorAll("h1,h2,h3,h4")].map((node) => ({
          text: node.textContent?.trim(),
          ...describe(node),
        })),
        images: [...element.querySelectorAll("img")].map((image) => ({
          src: image.currentSrc || image.src,
          alt: image.alt,
          width: image.naturalWidth,
          height: image.naturalHeight,
          loading: image.loading,
          styles: styles(image),
        })),
        videos: [...element.querySelectorAll("video")].map((video) => ({
          src: video.currentSrc || video.src || video.querySelector("source")?.src || null,
          poster: video.poster || null,
          autoplay: video.autoplay,
          loop: video.loop,
          muted: video.muted,
        })),
        canvasCount: element.querySelectorAll("canvas").length,
        svgCount: element.querySelectorAll("svg").length,
        links: [...element.querySelectorAll("a")].slice(0, 100).map((link) => ({
          text: link.textContent?.trim(),
          href: link.href,
        })),
      }));

    const assets = {
      images: [...document.images].map((image) => ({
        src: image.currentSrc || image.src,
        srcset: image.srcset,
        alt: image.alt,
        width: image.naturalWidth,
        height: image.naturalHeight,
        parentClasses: typeof image.parentElement?.className === "string" ? image.parentElement.className : null,
        siblingImages: image.parentElement?.querySelectorAll("img").length || 0,
        position: getComputedStyle(image).position,
        zIndex: getComputedStyle(image).zIndex,
      })),
      videos: [...document.querySelectorAll("video")].map((video) => ({
        src: video.currentSrc || video.src || video.querySelector("source")?.src || null,
        poster: video.poster || null,
        autoplay: video.autoplay,
        loop: video.loop,
        muted: video.muted,
      })),
      backgroundImages: [...document.querySelectorAll("*")]
        .map((element) => ({
          backgroundImage: getComputedStyle(element).backgroundImage,
          element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${String(element.className || "").split(" ").slice(0, 3).join(".")}`,
        }))
        .filter(({ backgroundImage }) => backgroundImage && backgroundImage !== "none"),
      resources: performance
        .getEntriesByType("resource")
        .map((entry) => ({ name: entry.name, initiatorType: entry.initiatorType })),
      inlineSvgs: [...document.querySelectorAll("svg")].map((svg, index) => ({
        index,
        label: svg.getAttribute("aria-label"),
        classes: svg.getAttribute("class"),
        markup: svg.outerHTML,
      })),
      favicons: [...document.querySelectorAll("link[rel*='icon']")].map((link) => ({
        href: link.href,
        sizes: link.sizes?.toString() || null,
      })),
    };

    const topElements = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > innerWidth * 0.8 && rect.height > 35 && rect.height < innerHeight * 1.5;
      })
      .slice(0, 120)
      .map(describe);

    const stickyOrFixed = [...document.querySelectorAll("body *")]
      .filter((element) => ["fixed", "sticky"].includes(getComputedStyle(element).position))
      .map(describe);

    const interactive = [...document.querySelectorAll("a,button,input,[role='button'],[tabindex]")]
      .slice(0, 500)
      .map((element) => ({
        ...describe(element),
        href: element instanceof HTMLAnchorElement ? element.href : null,
        ariaLabel: element.getAttribute("aria-label"),
        expanded: element.getAttribute("aria-expanded"),
        disabled: "disabled" in element ? Boolean(element.disabled) : null,
      }));

    const colorCounts = {};
    for (const element of [...document.querySelectorAll("body *")].slice(0, 3000)) {
      const computed = getComputedStyle(element);
      for (const value of [computed.color, computed.backgroundColor, computed.borderColor]) {
        if (!value || value === "rgba(0, 0, 0, 0)") continue;
        colorCounts[value] = (colorCounts[value] || 0) + 1;
      }
    }

    return {
      url: location.href,
      title: document.title,
      metaDescription: document.querySelector("meta[name='description']")?.content || null,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        htmlClasses: document.documentElement.className,
        bodyClasses: document.body.className,
      },
      frameworkSignals: {
        next: Boolean(document.querySelector("#__next,script#__NEXT_DATA__")),
        remix: Boolean(window.__remixContext),
        lenis: document.documentElement.classList.contains("lenis") || Boolean(document.querySelector(".lenis")),
      },
      fonts: [...document.fonts].map((font) => ({
        family: font.family,
        style: font.style,
        weight: font.weight,
        status: font.status,
      })),
      body: describe(document.body),
      header: document.querySelector("header") ? describe(document.querySelector("header")) : null,
      main: document.querySelector("main") ? describe(document.querySelector("main")) : null,
      sections,
      topElements,
      stickyOrFixed,
      interactive,
      assets,
      colorCounts: Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 80),
    };
  });

  const headerStates = [];
  for (const position of [0, 100, 900, Math.max(0, Math.round(scrollMetrics.height * 0.35))]) {
    await page.evaluate((y) => window.scrollTo(0, y), position);
    await page.waitForTimeout(450);
    headerStates.push(
      await page.evaluate((y) => {
        const header = document.querySelector("header");
        if (!header) return { y, missing: true };
        const computed = getComputedStyle(header);
        const html = document.documentElement;
        return {
          y,
          htmlClasses: html.className,
          navTheme: html.getAttribute("data-nav-theme"),
          navBg: html.getAttribute("data-nav-bg"),
          className: header.className,
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          opacity: computed.opacity,
          transform: computed.transform,
          boxShadow: computed.boxShadow,
          transition: computed.transition,
        };
      },
      position),
    );
  }
  extraction.headerStates = headerStates;
  allResults[viewport.name] = extraction;

  await writeFile(
    path.join(researchRoot, `${viewport.name}-extraction.json`),
    JSON.stringify(extraction, null, 2),
  );

  if (viewport.primary) {
    await writeFile(path.join(researchRoot, "rendered.html"), await page.content());
    const sectionsForCapture = extraction.sections
      .filter((section) => section.rect.height >= 260)
      .slice(0, 24);
    for (const section of sectionsForCapture) {
      const y = Math.max(0, section.rect.y - 90);
      await page.evaluate((position) => window.scrollTo(0, position), y);
      await page.waitForTimeout(500);
      const name = (section.id || section.headings?.[0]?.text || `section-${section.index}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || `section-${section.index}`;
      await page.screenshot({
        path: path.join(screenshotRoot, `desktop-${String(section.index).padStart(2, "0")}-${name}.png`),
        fullPage: false,
        animations: "allow",
      });
    }
  }

  await context.close();
  console.log(`Captured ${viewport.name}: ${scrollMetrics.height}px document`);
}

await writeFile(
  path.join(researchRoot, "viewport-summary.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(allResults).map(([name, result]) => [name, {
        viewport: result.viewport,
        document: result.document,
        sectionCount: result.sections.length,
        imageCount: result.assets.images.length,
        videoCount: result.assets.videos.length,
        backgroundImageCount: result.assets.backgroundImages.length,
        inlineSvgCount: result.assets.inlineSvgs.length,
        interactiveCount: result.interactive.length,
      }]),
    ),
    null,
    2,
  ),
);

await browser.close();
