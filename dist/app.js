const $ = s => document.querySelector(s);
const baseCSS = `body { margin: 0; font-family: system-ui, sans-serif; background: #f7f6fc; color: #252139; }
button { cursor: pointer; }
/* Tailwind와 일반 CSS를 함께 사용할 수 있어요. */`;
const react = `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState<number>(0);
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-violet-500 text-4xl mb-6">✳</div>
        <p className="text-xs tracking-widest text-violet-500 font-bold">HELLO, BUILDER.</p>
        <h1 className="text-4xl font-bold tracking-tight my-4">작은 시작,<br />무한한 가능성.</h1>
        <p className="text-sm text-slate-500 leading-6 mb-7">왼쪽 코드를 바꿔보세요.<br />당신의 아이디어가 여기서 움직입니다.</p>
        <button onClick={() => { setCount(count + 1); console.log('클릭!', count + 1); }}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 py-3 text-sm shadow-lg shadow-violet-200">
          클릭해 보세요 <span className="ml-4 opacity-70">{count} →</span>
        </button>
        <div className="mt-10 pt-4 border-t border-violet-100 text-xs text-slate-400">React + TypeScript + Tailwind CSS</div>
      </div>
    </main>
  );
}`;
const vue = `<script setup lang="ts">
import { ref } from 'vue';
const count = ref<number>(0);
function increment() {
  count.value++;
  console.log('Vue 클릭!', count.value);
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center p-8">
    <div class="max-w-sm w-full">
      <div class="text-emerald-500 text-4xl mb-6">◈</div>
      <p class="text-xs tracking-widest text-emerald-600 font-bold">HELLO, VUE.</p>
      <h1 class="text-4xl font-bold tracking-tight my-4">반응하는 코드,<br>살아있는 화면.</h1>
      <p class="text-sm text-slate-500 leading-6 mb-7">template, script, style을 한곳에서.<br>지금 자유롭게 수정해 보세요.</p>
      <button @click="increment" class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3 text-sm">클릭해 보세요 {{ count }} →</button>
      <div class="mt-10 pt-4 border-t border-emerald-100 text-xs text-slate-400">Vue + TypeScript + Tailwind CSS</div>
    </div>
  </main>
</template>

<style scoped>
h1 { letter-spacing: -0.05em; }
</style>`;
const defaults = {react:{'App.tsx':react,'style.css':baseCSS},vue:{'App.vue':vue,'style.css':baseCSS},html:{'index.html':`<main class="min-h-screen flex items-center justify-center p-8">
  <div class="max-w-sm">
    <p class="text-violet-500 text-xs tracking-widest">HELLO, WEB.</p>
    <h1 class="text-4xl font-bold my-4">웹의 시작은<br>한 줄의 코드.</h1>
    <p class="text-slate-500 text-sm mb-6">HTML, CSS, JavaScript로 자유롭게 실험하세요.</p>
    <button id="counter" class="bg-violet-600 text-white px-6 py-3 rounded-xl">클릭해 보세요 0 →</button>
  </div>
</main>`,'style.css':baseCSS,'script.js':`let count = 0;
document.querySelector('#counter').onclick = event => {
  event.currentTarget.textContent = '클릭해 보세요 ' + (++count) + ' →';
  console.log('HTML 클릭!', count);
};`}};
let projects=structuredClone(defaults), mode='react', file='App.tsx', timer, generation=0, logCount=0;
try { const saved=JSON.parse(localStorage.getItem('looplab-v1')); if(saved && ['react','vue','html'].includes(saved.mode) && Object.keys(defaults).every(m=>Object.keys(defaults[m]).every(f=>typeof saved.projects?.[m]?.[f]==='string'))) {projects=saved.projects;mode=saved.mode;$('#tailwind').checked=saved.tailwind!==false;} } catch {}
function save(){try{localStorage.setItem('looplab-v1',JSON.stringify({projects,mode,tailwind:$('#tailwind').checked}));$('#saveStatus').textContent='✓ 이 브라우저에 저장됨';}catch{$('#saveStatus').textContent='저장 공간 사용 불가';}}
function showFile(name){file=name;$('#editor').value=projects[mode][file];$('#filetabs').replaceChildren(...Object.keys(projects[mode]).map(name=>{const b=document.createElement('button');b.textContent=name;b.className=name===file?'active':'';b.onclick=()=>showFile(name);return b;}));$('#language').textContent=file.split('.').pop().toUpperCase();lines();}
function lines(){const e=$('#editor');$('#lines').textContent=Array.from({length:e.value.split('\n').length},(_,i)=>i+1).join('\n');const before=e.value.slice(0,e.selectionStart).split('\n');$('#cursor').textContent=`Ln ${before.length}, Col ${before.at(-1).length+1}`;$('#lines').scrollTop=e.scrollTop;}
function chooseMode(m){mode=m;showFile(Object.keys(projects[mode])[0]);document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('#modeLabel').textContent={react:'React + TypeScript',vue:'Vue + TypeScript',html:'HTML + JavaScript'}[mode];$('#previewMode').textContent=mode;save();run();}
function log(type,text){if(!logCount)$('#logs').replaceChildren();const row=document.createElement('div');row.className='log '+type;const time=document.createElement('time');time.textContent=new Date().toLocaleTimeString('ko-KR',{hour12:false});row.append(time,document.createTextNode(String(text)));$('#logs').append(row);while($('#logs').children.length>200)$('#logs').firstChild.remove();$('#logCount').textContent=++logCount;$('#logs').scrollTop=$('#logs').scrollHeight;}
const scriptTag = code => '<script type="module">'+code.replace(/<\/script/gi,'<\\/script')+'<\/script>';
let compiler;
async function run(){const id=++generation;$('#buildStatus').textContent='컴파일 중…';const p={...projects[mode]}, currentMode=mode, tw=$('#tailwind').checked;try{
let code='', markup='<div id="root"></div>', css=p['style.css'];
if(currentMode==='react') {if(!window.Babel)throw Error('Babel CDN 로딩에 실패했어요. 인터넷 연결 후 새로고침하세요.');code=Babel.transform(p['App.tsx'],{filename:'App.tsx',presets:[['react',{runtime:'classic'}],'typescript']}).code;code+=`\nimport {createRoot} from 'react-dom/client';\ncreateRoot(document.getElementById('root')).render(React.createElement(App));`;code=code.replace(/export default function\s+([\w$]+)/,(_,name)=>`function ${name}`).replace(/React.createElement\(App\)/,()=>{const m=p['App.tsx'].match(/export default function\s+([\w$]+)/);return `React.createElement(${m?m[1]:'App'})`;});if(/export default/.test(code)){code=code.replace(/export default /,'const __default = ');code=code.replace(/createRoot\(document.getElementById\('root'\)\).render\(.*\);$/,`createRoot(document.getElementById('root')).render(React.createElement(__default));`);}}
else if(currentMode==='vue'){compiler ||= await import('https://esm.sh/@vue/compiler-sfc@3.5.22');const {descriptor,errors}=compiler.parse(p['App.vue']);if(errors.length)throw errors[0];const scoped=descriptor.styles.some(s=>s.scoped), scope='data-v-looplab';let bindings={};if(descriptor.script||descriptor.scriptSetup){const result=compiler.compileScript(descriptor,{id:scope,genDefaultAs:'__sfc__'});code=result.content;bindings=result.bindings;}else code='const __sfc__ = {};';if(descriptor.template){const result=compiler.compileTemplate({id:scope,source:descriptor.template.content,filename:'App.vue',scoped,compilerOptions:{bindingMetadata:bindings}});if(result.errors.length)throw result.errors[0];code+='\n'+result.code.replace('export function render','function render')+'\n__sfc__.render = render;';}if(scoped)code+=`\n__sfc__.__scopeId = '${scope}';`;for(const s of descriptor.styles){if(s.lang && s.lang!=='css')throw Error('이 버전은 Vue style에서 CSS를 지원해요.');const r=compiler.compileStyle({source:s.content,id:scope,scoped:s.scoped});if(r.errors.length)throw r.errors[0];css+='\n'+r.code;}code=Babel.transform(code,{filename:'App.ts',presets:['typescript']}).code+`\nimport {createApp} from 'vue';createApp(__sfc__).mount('#root');`;}
else {markup=p['index.html'];code=p['script.js'];}
const bridge=`const report=(type,text)=>parent.postMessage({looplab:true,id:${id},type,text},'*');const fmt=x=>{try{return typeof x==='string'?x:JSON.stringify(x)}catch{return String(x)}};for(const level of ['log','warn','error','info']){const original=console[level];console[level]=(...args)=>{original.apply(console,args);report(level,args.map(fmt).join(' '))}}addEventListener('error',e=>report('error',e.message));addEventListener('unhandledrejection',e=>report('error',String(e.reason)));const originalFetch=fetch;window.fetch=async(...args)=>{const start=performance.now();try{const r=await originalFetch(...args);report('network',String(args[0]?.url||args[0])+' → '+r.status+' · '+Math.round(performance.now()-start)+'ms');return r}catch(e){report('error','Fetch 실패: '+e.message+' (CORS와 URL 확인)');throw e}};`;
const imports={imports:{react:'https://esm.sh/react@19.1.1','react-dom/client':'https://esm.sh/react-dom@19.1.1/client?external=react',vue:'https://esm.sh/vue@3.5.22'}};
if(id!==generation)return;$('#preview').srcdoc='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>'+bridge+'<\/script><script type="importmap">'+JSON.stringify(imports)+'<\/script>'+(tw?'<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"><\/script>':'')+'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style></head><body>'+markup+scriptTag(code+`\nparent.postMessage({looplab:true,id:${id},type:'ready',text:'실행 완료'},'*');`)+'</body></html>';$('#buildStatus').textContent='불러오는 중…';
}catch(e){if(id!==generation)return;$('#buildStatus').textContent='컴파일 오류';log('error',e.message||e);}}
window.addEventListener('message',e=>{if(e.source!==$('#preview').contentWindow||!e.data?.looplab||e.data.id!==generation)return;if(e.data.type==='ready'){$('#buildStatus').textContent='● 실행 중';return;}if(e.data.type==='error')$('#buildStatus').textContent='실행 오류';log(e.data.type,e.data.text);});
$('#editor').addEventListener('input',()=>{projects[mode][file]=$('#editor').value;lines();save();clearTimeout(timer);if($('#autorun').checked)timer=setTimeout(run,650);});$('#editor').addEventListener('scroll',lines);$('#editor').addEventListener('click',lines);$('#editor').addEventListener('keyup',lines);$('#editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.target;t.setRangeText('  ',t.selectionStart,t.selectionEnd,'end');t.dispatchEvent(new Event('input'));}});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>chooseMode(b.dataset.mode));$('#run').onclick=run;$('#refresh').onclick=run;$('#tailwind').onchange=()=>{save();run();};$('#autorun').onchange=()=>{clearTimeout(timer);if($('#autorun').checked)run();};document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();run();}});$('#reset').onclick=()=>{if(confirm('현재 프레임워크의 코드를 기본 예제로 복원할까요?')){projects[mode]=structuredClone(defaults[mode]);showFile(Object.keys(projects[mode])[0]);save();run();}};
for(const device of ['desktop','mobile'])$('#'+device).onclick=()=>{$('#preview').classList.toggle('mobile',device==='mobile');$('#desktop').classList.toggle('active',device==='desktop');$('#mobile').classList.toggle('active',device==='mobile');};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tool]').forEach(t=>t.classList.toggle('active',t===b));$('#apiPanel').hidden=b.dataset.tool!=='api';$('#consolePanel').hidden=b.dataset.tool!=='console';});$('#clear').onclick=()=>{logCount=0;$('#logCount').textContent=0;$('#logs').replaceChildren();$('#response').textContent='응답 본문과 상태를 여기서 확인하세요.';$('#apiStatus').textContent='요청 대기 중';};
let controller;$('#cancel').onclick=()=>controller?.abort();$('#send').onclick=async()=>{const button=$('#send');let timeout;try{const url=new URL($('#url').value);if(!['https:','http:'].includes(url.protocol))throw Error('HTTP 또는 HTTPS URL을 입력하세요.');const headers=JSON.parse($('#headers').value||'{}');if(!headers||Array.isArray(headers)||typeof headers!=='object')throw Error('헤더는 JSON 객체로 입력하세요.');controller=new AbortController();button.disabled=true;$('#cancel').disabled=false;$('#apiStatus').textContent='요청 중…';const method=$('#method').value;timeout=setTimeout(()=>controller.abort(),30000);const start=performance.now();const r=await fetch(url,{method,headers,body:['GET','HEAD'].includes(method)?undefined:$('#body').value,signal:controller.signal,credentials:'omit'});const text=await r.text();$('#apiStatus').textContent=`${r.status} ${r.statusText} · ${Math.round(performance.now()-start)} ms`;try{$('#response').textContent=JSON.stringify(JSON.parse(text),null,2);}catch{$('#response').textContent=text||'(응답 본문 없음)';}log('network',`${method} ${url} → ${r.status}`);}catch(e){$('#apiStatus').textContent='요청 실패';$('#response').textContent=e.name==='AbortError'?'요청이 취소되었거나 30초 제한을 초과했어요.':e.message+'\n\nURL, 네트워크 연결, 서버의 CORS 허용 설정을 확인하세요.';log('error',$('#response').textContent);}finally{clearTimeout(timeout);button.disabled=false;$('#cancel').disabled=true;controller=null;}};
$('#download').onclick=()=>{const blob=new Blob([JSON.stringify({name:'Looplab project',mode,tailwind:$('#tailwind').checked,files:projects[mode]},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`looplab-${mode}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};chooseMode(mode);

// Keep secondary controls out of the main writing surface.
const frameworkLabel = {react:'React',vue:'Vue',html:'HTML'};
$('#frameworkName').textContent=frameworkLabel[mode];
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  $('#frameworkName').textContent=frameworkLabel[button.dataset.mode];
  $('#frameworkMenu').open=false;
}));
document.addEventListener('click',event=>{
  document.querySelectorAll('details.menu[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('details.menu').forEach(menu=>menu.open=false);});
