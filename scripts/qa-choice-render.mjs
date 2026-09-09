import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

// Code-only SSR test. No browser, screenshots, or visual acceptance.
const output = path.resolve('temp/choice-render-test');
await mkdir(output, { recursive: true });
const css = await readFile('src/components/entangled/ChoiceRoomV4.module.css', 'utf8');
for (const file of ['choice-data.ts', 'site-motion.ts', 'ChoiceArtwork.tsx', 'ChoiceGames.tsx', 'ChoiceLab.tsx']) {
  let source = await readFile(`src/components/entangled/${file}`, 'utf8');
  for (const match of source.matchAll(/styles\.([a-zA-Z]+)/g)) assert.ok(css.includes(`.${match[1]}`), `Missing CSS class: ${match[1]}`);
  source = source.replace('import styles from "./ChoiceRoomV4.module.css";', 'const styles = new Proxy({}, { get: (_, key) => String(key) });');
  source = source.replace('import Image from "next/image";', 'import NextImage from "next/image.js"; const Image = NextImage.default ?? NextImage;');
  source = source.replace(/from (["'])\.\/(choice-data|site-motion|ChoiceArtwork|ChoiceGames)\1/g, 'from "./$2.mjs"');
  const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  await writeFile(path.join(output, file.replace(/\.tsx?$/, '.mjs')), compiled.outputText);
}
const { ChoiceLab } = await import(pathToFileURL(path.join(output, 'ChoiceLab.mjs')));
for (const categoryId of ['food', 'style', 'travel']) {
  const html = renderToStaticMarkup(React.createElement(ChoiceLab, { categoryId, onClose() {} }));
  assert.equal((html.match(/data-option-card="true"/g) ?? []).length, 10, `${categoryId}: ten cards rendered`);
  assert.ok(html.includes('ANOTHER EDIT'));
  assert.ok(html.includes('galleryEdition'));
  assert.ok(html.includes('ON YOUR TABLE / 4 CHOSEN'));
  assert.ok(!html.includes('data-motion-toggle'));
  assert.ok(html.includes('data-motion="full"'));
  console.log(`${categoryId}: SSR renders 10 image cards, batch button, selected tray and full-motion gallery.`);
}
const manifest = JSON.parse(await readFile('public/entangled/choices-v4/sources.json', 'utf8'));
assert.equal(manifest.assets.length, 60);
assert.equal(new Set(manifest.assets.map(asset => asset.sha256)).size, 60);
for (const asset of manifest.assets) {
  const bytes = await readFile(`public/entangled/choices-v4/${asset.filename}`);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 800);
  assert.equal(asset.sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.equal(asset.image, `/entangled/choices-v4/${asset.id}.webp`);
  assert.equal(asset.generator, 'built-in image_gen');
}
console.log('60 unique local paintings decode and match option IDs and manifest hashes. No visual QA performed.');
