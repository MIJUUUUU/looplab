// Run with BABEL_PATH and VUE_COMPILER_PATH pointing to the official CDN builds.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
const Babel=require(process.env.BABEL_PATH),compiler=await import(pathToFileURL(process.env.VUE_COMPILER_PATH));
const elements=new Map(),messages=[],timers=new Map();let sequence=0,writes=0;
function element(){return {value:'',checked:true,selectionStart:0,scrollTop:0,textContent:'',children:[],dataset:{},hidden:false,contentWindow:{},handlers:{},classList:{toggle(){}},setAttribute(){},replaceChildren(...x){this.children=x},append(...x){this.children.push(...x)},addEventListener(type,fn){(this.handlers[type]||=[]).push(fn)},dispatch(type){for(const f of this.handlers[type]||[])f({target:this})}};}
function $(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}
Object.defineProperty($('#preview'),'srcdoc',{get(){return this.html},set(v){this.html=v;writes++}});
const context={console,Babel,structuredClone,URL,Blob,AbortController,requestAnimationFrame:fn=>fn(),testCompiler:compiler,setTimeout:(fn,ms)=>{timers.set(++sequence,{fn,ms});return sequence},clearTimeout:id=>timers.delete(id),localStorage:{getItem(){return null},setItem(){}},document:{querySelector:$,querySelectorAll(){return []},createElement:element,createTextNode:x=>x,addEventListener(){}},window:{Babel,addEventListener(type,fn){if(type==='message')messages.push(fn)}}};
vm.createContext(context);
const source=fs.readFileSync('dist/app.js','utf8').replace("compiler ||= await import('https://esm.sh/@vue/compiler-sfc@3.5.22')","compiler ||= testCompiler");
vm.runInContext(source,context);const evaluate=s=>vm.runInContext(s,context);await Promise.resolve();await Promise.resolve();
const edit=text=>{$('#editor').value=text;$('#editor').dispatch('input')};
const ready=id=>messages.forEach(fn=>fn({source:$('#preview').contentWindow,data:{looplab:true,id,type:'ready'}}));
edit('import React from "react";export default function App(){return <p>latest</p>}');
assert([...timers.values()].some(x=>x.ms===250));const before=writes;
await $('#run').onclick();assert.equal(writes,before+1);assert($('#preview').srcdoc.includes('latest'));
assert(![...timers.values()].some(x=>x.ms===250));console.log('PASS manual run reads latest code and cancels pending auto run');
const raceBefore=writes;
$('#editor').value='import React from "react";export default function App(){return <p>old run</p>}';
const firstRun=$('#run').onclick();
$('#editor').value='import React from "react";export default function App(){return <p>winning run</p>}';
const secondRun=$('#run').onclick();await Promise.all([firstRun,secondRun]);
assert.equal(writes,raceBefore+1);assert($('#preview').srcdoc.includes('winning run'));console.log('PASS competing runs publish only the newest snapshot');
$('#autorun').checked=false;$('#autorun').onchange();$('#editor').value='import React from "react";export default function App(){return <p>manual</p>}';
await $('#run').onclick();assert($('#preview').srcdoc.includes('manual'));console.log('PASS manual run works with auto-run disabled and reads textarea directly');
$('#autorun').checked=true;edit('import React from "react";export default function App(){return <p>automatic</p>}');
let pending=[...timers.entries()].find(([,t])=>t.ms===250);timers.delete(pending[0]);await pending[1].fn();assert($('#preview').srcdoc.includes('automatic'));console.log('PASS automatic preview after 250ms');
let current=evaluate('generation');edit('import React from "react";export default function App(){return <p>newer</p>}');ready(current);assert.equal($('#buildStatus').dataset.state,'pending');console.log('PASS obsolete preview cannot report current edits as ready');
$('#editor').dispatch('compositionstart');edit('import React from "react";export default function App(){return <p>한글</p>}');assert(![...timers.values()].some(x=>x.ms===250));$('#editor').dispatch('compositionend');assert([...timers.values()].some(x=>x.ms===250));console.log('PASS Korean composition defers automatic execution');
edit('export default function {');await $('#run').onclick();assert.equal($('#buildStatus').dataset.state,'error');assert.equal($('#previewError').hidden,false);ready(evaluate('generation'));assert.equal($('#buildStatus').dataset.state,'error');console.log('PASS visible compiler error is not overwritten by ready messages');
for(const mode of ['react','vue','html']){evaluate(`projects=structuredClone(defaults);chooseMode('${mode}')`);await Promise.resolve();await Promise.resolve();assert.notEqual($('#buildStatus').dataset.state,'error');const code=$('#preview').srcdoc.match(/<script type="module">([\s\S]*?)<\/script>/)[1];Babel.transform(code,{sourceType:'module',presets:[]});ready(evaluate('generation'));assert.equal($('#buildStatus').dataset.state,'ready');console.log('PASS',mode,'compilation and latest-code status');}
})().catch(e=>{console.error(e);process.exitCode=1});
