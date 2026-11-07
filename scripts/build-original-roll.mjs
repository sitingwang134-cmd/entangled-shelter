import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

// Mechanical adaptation: keep the original geometry, solver and camera intact.
let html = await fs.readFile('docs/research/paper-roll-nine-vercel-app/original/index.html', 'utf8');
const original = html;
const replace = (from, to) => { assert.ok(html.includes(from), `Missing source anchor: ${from.slice(0, 80)}`); html = html.replace(from, to); };
replace('VX — The Printing Roll', 'The Decision Archive — Entangled Shelter');
replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', './three-r128.min.js');
replace('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', './gsap.min.js');
html = html.replaceAll('#eaeaec', '#354d43').replaceAll('0xeaeaec', '0x354d43').replaceAll('0xe7e7ea', '0x354d43');
replace('vec3(0.905, 0.905, 0.912)', 'vec3(0.208, 0.302, 0.263)');
replace('<div class="mark">VX<sup>&reg;</sup></div>', '<div class="mark">ES<sup>✳</sup></div>');
replace('Press Division', 'Entangled Shelter');
replace('Selected works<br /><b>Edition 2019 &mdash; 2026</b>', 'Traces of decisions<br /><b>The Living Ledger</b>');
replace('Pages printed', 'Leaves unfurled');
replace('</style>', `
      .hud { color: #f1ecdf; }
      #brand .mark { font-family: Georgia, serif; }
      #edition { top: 100px; }
      #actions { position:fixed; top:30px; right:40px; z-index:30; display:flex; gap:8px; }
      #actions a, #actions button { font:12px/1.4 Arial,sans-serif; color:#243029; text-decoration:none; border:1px solid #24302966; border-radius:22px; padding:10px 16px; background:#f2efe4e6; cursor:pointer; }
      #records { position:fixed; z-index:40; right:30px; top:85px; bottom:100px; width:min(440px,calc(100vw - 40px)); overflow:auto; padding:24px; background:#f2efe4f5; border:1px solid #24302966; box-shadow:0 18px 70px #24302926; color:#243029; touch-action:pan-y; user-select:text; }
      #records[hidden] { display:none; }
      #records h1 { font:28px Georgia,serif; margin-bottom:12px; }
      #records p { font-size:12px; line-height:1.8; }
      #records ol { list-style:none; }
      #records li { border-top:1px solid #24302933; padding:18px 0; }
      #records strong { display:block; font:22px Georgia,serif; margin:7px 0; }
      #records time { display:block; font-size:11px; margin-top:8px; }
      #records button { border:0; background:transparent; color:#243029; padding:8px 0; cursor:pointer; text-decoration:underline; }
      #hint { letter-spacing:.08em; }
      @media(max-width:720px) { #brand .sub { display:none; } #actions { top:20px; right:16px; gap:5px; } #actions a,#actions button { font-size:10px; padding:8px 10px; } #edition { top:80px; right:22px; font-size:8px; } #hint { font-size:9px; max-width:60%; } #records { right:20px; } }
    </style>`);
replace('<canvas id="stage"></canvas>', `<canvas id="stage" aria-label="Three-dimensional paper roll"></canvas>
    <nav id="actions" aria-label="Archive controls"><a href="/" target="_top">Return to shelter ↖</a><button id="listToggle" aria-expanded="false" aria-controls="records">Decision index</button><button id="bankButton">Next folio</button></nav>
    <section id="records" hidden aria-label="Decision history"><h1>The Decision Archive</h1><p id="recordCount"></p><ol id="recordList"></ol></section>`);

const atlasStart = html.indexOf('        function buildAtlas() {');
const atlasEnd = html.indexOf('        // Spiral cap:', atlasStart);
assert.ok(atlasStart > 0 && atlasEnd > atlasStart);
const atlas = await fs.readFile('scripts/media/original-roll-atlas.txt', 'utf8');
html = html.slice(0, atlasStart) + atlas + '\n' + html.slice(atlasEnd);
// Overlay controls must not steer or pause the scene.
replace('        function onPointer(e) {', '        function onPointer(e) {\n          if (e.target.closest && e.target.closest("#actions, #records")) return;');
replace('            downX = e.clientX;', '            if (e.target.closest && e.target.closest("#actions, #records")) { downT = -Infinity; return; }\n            downX = e.clientX;');
replace('            var dx = e.clientX - downX,', '            if (e.target.closest && e.target.closest("#actions, #records")) return;\n            var dx = e.clientX - downX,');
replace('        // Intro\n', '        installArchiveControls();\n\n        // Intro\n');
replace('          elapsed += dt;', '          if (document.hidden) return;\n          elapsed += dt;');
replace('        frame();', '        frame();\n        document.body.dataset.rollReady = "true";');
// These exact blocks are the fidelity contract, not a replacement animation.
for (const [start, end] of [
  ['        // ---------- Constants ----------', '        // ---------- Renderer / scene ----------'],
  ['        var barrelTex = atlasTex.clone();', '        var uTailS = { value: 0 };'],
  ['        var pos = new THREE.Vector2(0, 0);', '        // Input — pointer'],
  ['        function updateTarget(t, dt) {', '        // HUD'],
  ['        (function preroll() {', '        // Main loop'],
]) {
  const block = original.slice(original.indexOf(start), original.indexOf(end, original.indexOf(start))).replace('vec3(0.905, 0.905, 0.912)', 'vec3(0.208, 0.302, 0.263)');
  assert.ok(block.length > 80 && html.includes(block), `Original roll core changed: ${start}`);
}
await fs.writeFile('public/entangled/paper-roll/index.html', html);
console.log('Original roll generated; geometry, solver, camera, pre-roll and UV mapping preserved verbatim.');

