import "./qa-original-roll.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const html = await fs.readFile("out/history.html", "utf8");
assert.ok(html.includes("/entangled/paper-roll/index.html?v=11"));
assert.equal(await fs.readFile("out/entangled/paper-roll/index.html", "utf8"), await fs.readFile("public/entangled/paper-roll/index.html", "utf8"));
console.log("Exported history route embeds the verified original 3D roll.");
