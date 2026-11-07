import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

// Runs actual Three.js geometries/solver with only GPU and DOM stubs, not a visual test.
const three = await fs.readFile('public/entangled/paper-roll/three-r128.min.js', 'utf8');
const original = await fs.readFile('docs/research/paper-roll-nine-vercel-app/original/index.html', 'utf8');
const restored = await fs.readFile('public/entangled/paper-roll/index.html', 'utf8');
const records = Array.from({length:24},(_,i)=>({id:String(i),categoryId:'food',mode:'poker',option:{name:'Result '+i,detail:'Detail '+i},decidedAt:'2026-09-09T08:01:02Z'}));

function createWorld(html, data = records, blocked = false) {
  let now = 0, frame;
  const rendered = [], painted = [], events = {}, elements = new Map();
  const gradient = {addColorStop(){}};
  const context2d = new Proxy({measureText:t=>({width:String(t).length*12}),fillText:t=>painted.push(String(t)),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient}, {get:(o,k)=>k in o ? o[k] : ()=>{}});
  const element = () => ({style:{},dataset:{},children:[],hidden:false,textContent:'',listeners:{},setAttribute(){},focus(){},closest(){return null;},addEventListener(k,f){this.listeners[k]=f;},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},getContext(){return context2d;}});
  const document = {body:element(),hidden:false,createElement:element,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);}};
  const sandbox = {console,document,performance:{now:()=>now},requestAnimationFrame:f=>{frame=f;},localStorage:{getItem(){if(blocked)throw Error('storage disabled');return JSON.stringify(data);}},gsap:{to(){},killTweensOf(){}},innerWidth:1440,innerHeight:900,devicePixelRatio:1,addEventListener(k,f){(events[k]??=[]).push(f);}};
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(three,sandbox);
  sandbox.THREE.WebGLRenderer=class {constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);rendered[0]={scene,camera};}};
  sandbox.THREE.Clock=class {getDelta(){return 1/60;}};
  const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function stepMotion'));
  assert.ok(script);
  vm.runInContext(script,sandbox,{timeout:10000});
  return {painted,elements,emit(type,event={}){for(const f of events[type]??[])f({target:document.body,...event});},tick(n){for(let i=0;i<n;i++){now+=1000/60;frame();}},snapshot(){const {scene,camera}=rendered[0];const roll=scene.children.find(n=>n.type==='Group');const ribbon=scene.children.find(n=>n.geometry?.attributes.aS);return {position:Array.from(roll.position.toArray()),rotation:roll.children[0].rotation.x,yaw:roll.rotation.y,camera:Array.from(camera.position.toArray()),ribbon:Array.from(ribbon.geometry.attributes.position.array),uv:Array.from(ribbon.geometry.attributes.uv.array)};}};
}
const ref=createWorld(original), clone=createWorld(restored);
assert.deepEqual(clone.snapshot(),ref.snapshot(),'Initial physical roll and paper trail match');
for(const event of [{clientX:1100,clientY:450},{clientX:200,clientY:730}]) {
  ref.emit('pointermove',event);clone.emit('pointermove',event);
  ref.tick(120);clone.tick(120);
  assert.deepEqual(clone.snapshot(),ref.snapshot(),'Steering, rolling, ribbon and camera match original');
}
ref.tick(300);clone.tick(300);
assert.deepEqual(clone.snapshot(),ref.snapshot(),'Idle autopilot matches original');
clone.emit('pointerdown',{clientX:400,clientY:400});clone.emit('pointerup',{clientX:400,clientY:400});
const paused=clone.snapshot();clone.tick(60);assert.deepEqual(clone.snapshot().position,paused.position,'Paused roll stops');
assert.equal(clone.elements.get('recordList').children.length,24);
clone.elements.get('bankButton').listeners.click();clone.elements.get('bankButton').listeners.click();
assert.ok(clone.painted.includes('Result 23'),'Last history bank appears on the physical atlas');
assert.ok(clone.elements.get('recordList').children[23].children.some(n=>n.dateTime==='2026-09-09T08:01:02Z'));
createWorld(restored,[]);createWorld(restored,[],true);
console.log('PASS: original vs restored geometry/UV, steering, idle camera, pause; 24 real records, last bank, timestamps, empty/blocked storage. GPU visuals left for user acceptance.');

