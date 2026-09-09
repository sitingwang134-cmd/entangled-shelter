import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Downloads only free Unsplash-hosted search results; never Unsplash+ or previews.
const root = new URL('../../', import.meta.url);
const destination = new URL('public/entangled/choices/', root);
await mkdir(destination, { recursive: true });
const manifest = [];
for (const category of ['food', 'style', 'travel']) {
  const search = JSON.parse(await readFile(new URL(`temp/choice-${category}-images.json`, root), 'utf8'));
  const seen = new Set();
  const photos = search.data.images.filter(item => {
    const url = new URL(item.imageUrl);
    if (url.hostname !== 'images.unsplash.com' || !url.pathname.startsWith('/photo-') || seen.has(url.pathname)) return false;
    seen.add(url.pathname);
    return true;
  }).slice(0, 5);
  if (photos.length !== 5) throw new Error(`${category}: expected five free photographs`);
  for (const [index, photo] of photos.entries()) {
    const url = new URL(photo.imageUrl);
    url.search = '?auto=format&fit=crop&w=880&q=85';
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Image download failed: ${response.status}`);
    const bytes = await sharp(Buffer.from(await response.arrayBuffer())).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    const filename = `${category}-${index + 1}.webp`;
    await writeFile(new URL(filename, destination), bytes);
    const { width, height } = await sharp(bytes).metadata();
    manifest.push({ filename, category, sourcePage: photo.url, sourceImage: url.href, license: 'https://unsplash.com/license', usage: 'Editorial mood illustration; not an exact product or destination photograph', width, height, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    console.log(`${filename}: ${width} × ${height}, ${bytes.length} bytes`);
  }
}
await writeFile(new URL('sources.json', destination), JSON.stringify({ generatedAt: new Date().toISOString(), assets: manifest }, null, 2) + '\n');
