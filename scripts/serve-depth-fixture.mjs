// A small, local-only test harness for the real component. No app route or
// project dependency is changed, and the component is compiled in memory.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const cwd = process.cwd();
const port = Number(process.env.DEPTH_FIXTURE_PORT ?? 3011);
const component = await fs.readFile(path.join(cwd, "src/components/entangled/DepthScene.tsx"), "utf8");
const css = await fs.readFile(path.join(cwd, "src/components/entangled/DepthScene.module.css"), "utf8");
const compiled = ts.transpileModule(component, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const modules = {
  react: await fs.readFile(path.join(cwd, "node_modules/react/cjs/react.production.js"), "utf8"),
  "react/jsx-runtime": await fs.readFile(path.join(cwd, "node_modules/react/cjs/react-jsx-runtime.production.js"), "utf8"),
  "react-dom": await fs.readFile(path.join(cwd, "node_modules/react-dom/cjs/react-dom.production.js"), "utf8"),
  "react-dom/client": await fs.readFile(path.join(cwd, "node_modules/react-dom/cjs/react-dom-client.production.js"), "utf8"),
  scheduler: await fs.readFile(path.join(cwd, "node_modules/scheduler/cjs/scheduler.production.js"), "utf8"),
  "./DepthScene.module.css": "module.exports = {scene:'scene',poster:'poster',stage:'stage',canvas:'canvas'};",
  component: compiled,
};
const names = ["station", "levitate", "salt", "room", "doorway", "angels", "atelier", "car", "hands"];
const definitions = Object.entries(modules).map(([name, source]) => `${JSON.stringify(name)}: function(module,exports,require){\n${source}\n}`).join(",\n");
const bundle = `(() => {
  const definitions = {${definitions}};
  const cache = {};
  function require(name) {
    if(cache[name]) return cache[name].exports;
    const module = {exports:{}}; cache[name]=module;
    if(!definitions[name]) throw new Error('Missing fixture module: '+name);
    definitions[name](module,module.exports,require); return module.exports;
  }
  const React = require('react');
  const {DepthScene} = require('component');
  const root = require('react-dom/client').createRoot(document.getElementById('fixture'));
  window.unmountDepthFixture = () => root.unmount();
  root.render(
    React.createElement(React.Fragment, null, ${JSON.stringify(names)}.map((name, index) =>
      React.createElement('section', {'data-depth-section':'', key:name},
        React.createElement('div', {className:'painting'},
          React.createElement(DepthScene, {image:'/entangled/'+name+'.webp', depth:'/entangled/'+name+'-depth.png', alt:name, focusX:index===0?0.7:0.5, priority:index===0}),
          React.createElement('span', {className:'label'}, name)
        )
      )
    ))
  );
})();`;
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>DepthScene render harness</title><style>html,body{margin:0;background:#141718;color:white}section{height:180vh;position:relative}.painting{position:sticky;top:0;width:100%;height:100vh}.label{position:absolute;left:24px;bottom:32px;font:16px monospace;color:white;text-shadow:0 1px 5px black}${css}</style></head><body><div id="fixture"></div><script src="/fixture.js"></script></body></html>`;

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
  } else if (pathname === "/fixture.js") {
    response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    response.end(bundle);
  } else if (/^\/entangled\/[a-z0-9.-]+$/.test(pathname)) {
    try {
      const bytes = await fs.readFile(path.join(cwd, "public", pathname));
      response.writeHead(200, { "Content-Type": pathname.endsWith(".png") ? "image/png" : "image/webp" });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end("Missing test asset");
    }
  } else {
    response.writeHead(404);
    response.end();
  }
});
server.listen(port, "127.0.0.1", () => console.log(`DepthScene fixture: http://127.0.0.1:${port}`));

