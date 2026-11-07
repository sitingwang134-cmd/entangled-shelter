import { mkdir, readFile, writeFile, rename, access } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const source = await readFile('src/components/entangled/choice-data.ts', 'utf8');
const { choiceCategories } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const originals = path.join(root, 'assets/generated-v4');
const output = path.join(root, 'public/entangled/choices-v4');
await mkdir(originals, { recursive: true });
const assets = [];
for (const category of Object.values(choiceCategories)) {
  for (const option of category.options) {
    if (!/^(food|style|travel)-[a-z]+$/.test(option.id)) throw new Error('Unexpected asset ID');
    const original = path.join(originals, option.id + '.png');
    const incoming = path.join(output, option.id + '.png');
    try { await access(original); } catch { await rename(incoming, original); }
    const bytes = await sharp(original).resize(800, 800, { fit: 'contain' }).webp({ quality: 88 }).toBuffer();
    await writeFile(path.join(output, option.id + '.webp'), bytes);
    assets.push({ id: option.id, name: option.name, detail: option.detail, filename: option.id + '.webp', image: option.image, generator: 'built-in image_gen', original: 'assets/generated-v4/' + option.id + '.png', promptRecord: 'docs/entangled-shelter/generated-v4/' + option.id + '.json', sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
  }
}
if (assets.length !== 60 || new Set(assets.map(a => a.sha256)).size !== 60) throw new Error('Expected 60 distinct paintings');
await writeFile(path.join(output, 'sources.json'), JSON.stringify({ edition: 'choice-v4', generatedAt: new Date().toISOString(), artDirection: 'Warm ivory, muted olive and ochre editorial oil painting; one exact subject per option.', assets }, null, 2));
console.log('Prepared 60 unique 800px WebP paintings:', assets.reduce((total, a) => total + a.bytes, 0), 'bytes. Originals preserved outside public.');

