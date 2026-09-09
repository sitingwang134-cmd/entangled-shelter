import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('out/index.html', 'utf8');
for (const id of ['food', 'style', 'travel']) {
  assert.ok(html.includes(`data-chapter-entry="${id}"`));
}
assert.equal((html.match(/20 POSSIBILITIES/g) || []).length, 3);
const text = html.replace(/<!--.*?-->/g, '');
for (const category of ['TASTE', 'STYLE', 'WANDER']) assert.ok(text.includes(`EXPLORE ALL ${category} POSSIBILITIES`));
const source = await readFile('src/components/entangled/EntangledShelter.tsx', 'utf8');
const panel = source.slice(source.indexOf('<article className={styles.pickCard}'), source.indexOf('<div className={styles.chapterNote}'));
assert.equal((panel.match(/open\(chapter.id\)/g) || []).length, 2);
assert.ok(!panel.includes('pickSuit'));
assert.ok(!panel.includes('data-tilt'));
assert.ok(panel.includes('chapter.subtitle'));
console.log('Three editorial chapter entrances verified: category routing, unique headings, no oversized suit or tilt. Code-only checks.');
