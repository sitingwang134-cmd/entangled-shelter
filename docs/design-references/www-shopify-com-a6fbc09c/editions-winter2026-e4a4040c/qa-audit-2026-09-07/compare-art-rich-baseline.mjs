import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const outputDir = path.dirname(fileURLToPath(import.meta.url));
const referenceDir = path.dirname(outputDir);
const pairs = [
  {
    viewport: "desktop-1440x900",
    original: "desktop-1440-hero.png",
    local: "qa/desktop-1440.png",
  },
  {
    viewport: "tablet-768x1024",
    original: "tablet-768-hero.png",
    local: "qa/tablet-768.png",
  },
  {
    viewport: "mobile-390x844",
    original: "mobile-390-hero.png",
    local: "qa/mobile-390.png",
  },
];

const results = [];
for (const pair of pairs) {
  const original = await sharp(path.join(referenceDir, pair.original))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const local = await sharp(path.join(referenceDir, pair.local))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = original.info.width * original.info.height;
  let exactChangedPixels = 0;
  let changedPixels = 0;
  let sumAbsoluteError = 0;
  for (let offset = 0; offset < original.data.length; offset += 4) {
    let exactDifference = false;
    let maxDifference = 0;
    for (let channel = 0; channel < 3; channel += 1) {
      const difference = Math.abs(original.data[offset + channel] - local.data[offset + channel]);
      exactDifference ||= difference > 0;
      maxDifference = Math.max(maxDifference, difference);
      sumAbsoluteError += difference;
    }
    if (exactDifference) exactChangedPixels += 1;
    if (maxDifference > 12) changedPixels += 1;
  }
  results.push({
    ...pair,
    width: original.info.width,
    height: original.info.height,
    changedPixelThreshold: 12,
    changedPixels,
    changedPercent: Number(((changedPixels / pixelCount) * 100).toFixed(6)),
    exactChangedPixels,
    exactChangedPercent: Number(((exactChangedPixels / pixelCount) * 100).toFixed(6)),
    meanAbsoluteErrorRgb: Number((sumAbsoluteError / (pixelCount * 3)).toFixed(6)),
  });
}

await fs.writeFile(
  path.join(outputDir, "art-rich-baseline-comparison.json"),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(JSON.stringify(results, null, 2));
