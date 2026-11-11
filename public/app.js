const $=selector=>document.querySelector(selector);
const PROVIDERS={openai:'OpenAI',anthropic:'Anthropic',gemini:'Gemini',openrouter:'OpenRouter',custom:'OpenAI 호환'};
const STORE='looplab-llm-v1';
let profiles=[],sessions=[],settings={system:'',maxTokens:2048},selection=[],mode='chat',currentId=null,busy=false;
const keys=new Map(),controllers=new Map();let noticeTimer;
try{const saved=JSON.parse(localStorage.getItem(STORE));if(saved){profiles=(saved.profiles||[]).filter(p=>p.id&&PROVIDERS[p.provider]&&typeof p.model==='string');sessions=(saved.sessions||[]).filter(s=>s.id&&Array.isArray(s.turns)).slice(0,30);settings={...settings,...saved.settings};selection=profiles.slice(0,1).map(p=>p.id);}}catch{}
for(const session of sessions)for(const turn of session.turns)for(const r of turn.results||[])if(r.status==='running')r.status='stopped';
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
function notice(text){$('#notice').textContent=text;$('#notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').hidden=true,6500)}
function save(){try{localStorage.setItem(STORE,JSON.stringify({profiles:profiles.map(({id,name,provider,model,baseURL})=>({id,name,provider,model,baseURL})),sessions:sessions.slice(0,30),settings}));}catch{notice('저장 공간이 부족해요. 대화를 내보내고 이전 기록을 정리해 주세요.')}}
const session=()=>sessions.find(s=>s.id===currentId);
const profile=id=>profiles.find(p=>p.id===id);
const keyFor=p=>{const entry=p&&keys.get(p.id);return entry&&entry.provider===p.provider&&entry.baseURL===(p.baseURL||'')?entry.secret:''};
const connected=p=>p&&(!!keyFor(p)||p.provider==='custom');
const isActive=()=>!!session()?.turns.length;
function showDialog(id){if(busy){notice('응답을 마치거나 중지한 뒤 변경해 주세요.');return}$(id).showModal()}
function renderHistory(){
 $('#history').replaceChildren();if(!sessions.length){$('#history').append(el('div','historyEmpty','첫 질문부터 시작해 보세요.\n대화가 여기에 모여요.'));return}
 for(const s of sessions){const row=el('div','historyItem'+(s.id===currentId?' active':'')),open=el('button','',s.title),del=el('button','delete','×');open.onclick=()=>openSession(s.id);del.setAttribute('aria-label',s.title+' 대화 삭제');del.onclick=()=>{if(busy)return notice('응답을 먼저 중지해 주세요.');if(!confirm('이 기기에서 이 대화를 삭제할까요?'))return;sessions=sessions.filter(x=>x.id!==s.id);if(currentId===s.id)newChat();save();renderHistory();};row.append(open,del);$('#history').append(row);}
}
function renderChips(){
 $('#selectedModels').replaceChildren();if(!selection.length)$('#selectedModels').append(el('span','emptychips','모델을 연결하면 바로 시작할 수 있어요'));
 for(const id of selection){const p=profile(id)||session()?.models.find(x=>x.id===id);if(!p)continue;const chip=el('button','modelchip'+(!connected(p)?' missing':''));chip.type='button';chip.append(el('i','modeldot '+p.provider),el('span','',p.name));if(!connected(p))chip.append(el('small','','키 필요'));chip.onclick=()=>{if(!profile(id))return notice('삭제된 모델이에요. 새 대화에서 모델을 선택하세요.');openModels(id)};$('#selectedModels').append(chip)}
 $('#connectionCount').textContent=profiles.length;$('#firstConnect').hidden=profiles.length>0;$('#selectModels').textContent=isActive()?'＋ 새 대화에서 모델 변경':'＋ 모델 선택';
}
function renderMode(){document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('#modeHelp').textContent=mode==='chat'?'하나의 모델과 편하게 대화하세요':'같은 질문을 최대 3개의 모델에 보내세요';$('#sendButton').setAttribute('aria-label',mode==='chat'?'질문 보내기':'선택한 모델들에 질문 보내기');}
function newChat(){if(busy)return notice('응답을 마치거나 중지한 뒤 새 대화를 시작하세요.');currentId=null;$('#turns').replaceChildren();$('#welcome').hidden=false;$('#viewLabel').textContent='새 대화';selection=selection.filter(id=>profile(id)).slice(0,mode==='chat'?1:3);renderChips();renderHistory();renderMode();document.body.classList.remove('sidebarOpen');$('#prompt').focus()}
function openSession(id){if(busy)return notice('응답을 먼저 중지해 주세요.');currentId=id;const s=session();mode=s.mode;selection=s.models.map(m=>m.id);$('#welcome').hidden=true;$('#viewLabel').textContent=s.title;renderMode();renderHistory();renderChips();renderTurns();document.body.classList.remove('sidebarOpen');scrollBottom()}
function scrollBottom(force=false){const box=$('#conversation');if(force||box.scrollHeight-box.scrollTop-box.clientHeight<160)box.scrollTop=box.scrollHeight}
function metricsText(r){const sec=n=>n==null?'—':(n/1000).toFixed(2)+'s';return [`첫 응답 ${sec(r.firstMs)}`,`완료 ${sec(r.elapsedMs)}`,`토큰 ${r.usage?.input??'—'} 입력 / ${r.usage?.output??'—'} 출력`]}
function resultCard(turn,result,index){
 const card=el('article','answer'+(turn.preferred===result.profileId?' preferred':''));card.dataset.result=result.id;
 const header=el('div','answerHeader');header.append(el('i','modeldot '+result.provider),el('strong','',result.name),el('span','answerStatus',statusLabel(result.status)));
 const body=el('div','answerText'+(!result.text?' waiting':''),result.text||(result.status==='running'?'답변을 기다리고 있어요…':'표시할 답변이 없어요.'));
 const error=el('div','answerError',result.error||'');error.hidden=!result.error;
 const metrics=el('div','metrics');for(const text of metricsText(result))metrics.append(el('span','',text));
 const actions=el('div','answerActions'),copy=el('button','','복사');copy.disabled=!result.text;copy.onclick=async()=>{try{await navigator.clipboard.writeText(result.text);copy.textContent='복사됨';setTimeout(()=>copy.textContent='복사',1500)}catch{notice('클립보드에 접근할 수 없어요. 답변을 선택해 복사해 주세요.')}};actions.append(copy);
 if(session()?.mode==='compare'){const vote=el('button',turn.preferred===result.profileId?'picked':'',turn.preferred===result.profileId?'✓ 선호하는 답변':'이 답변이 좋아요');vote.disabled=result.status!=='done';vote.onclick=()=>{turn.preferred=turn.preferred===result.profileId?null:result.profileId;save();renderTurns()};actions.append(vote)}
 if((result.status==='error'||result.status==='stopped')&&index===session().turns.length-1){const retry=el('button','','다시 시도');retry.disabled=busy;retry.onclick=()=>retryResult(turn,result);actions.append(retry)}
 card.append(header,body,error,metrics,actions);return card;
}
function statusLabel(status){return {running:'생성 중…',done:'완료',error:'연결 오류',stopped:'중지됨'}[status]||''}
function renderTurns(){const s=session();$('#turns').replaceChildren();if(!s)return;s.turns.forEach((turn,index)=>{const row=el('section','turn'+(s.mode==='chat'?' single':''));const user=el('div','userLine');user.append(el('div','userBubble',turn.prompt));const answers=el('div','answers');answers.style.setProperty('--columns',String(turn.results.length));for(const r of turn.results)answers.append(resultCard(turn,r,index));row.append(user,answers);$('#turns').append(row)});}
function updateResult(result){const card=document.querySelector(`[data-result="${result.id}"]`);if(!card)return;const text=card.querySelector('.answerText');text.textContent=result.text||'답변을 기다리고 있어요…';text.classList.toggle('waiting',!result.text);card.querySelector('.answerStatus').textContent=statusLabel(result.status);const error=card.querySelector('.answerError');error.textContent=result.error||'';error.hidden=!result.error;card.querySelector('.metrics').replaceChildren(...metricsText(result).map(x=>el('span','',x)));scrollBottom();}
function setBusy(value){busy=value;$('#sendButton').hidden=value;$('#stopButton').hidden=!value;document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=value);$('#newChat').disabled=value;$('#prompt').disabled=value;$('#selectModels').disabled=value;}
function contextFor(s,turn,p){const messages=[];for(const previous of s.turns){if(previous.id===turn.id)break;const r=previous.results.find(x=>x.profileId===p.id);if(r?.status==='done'){messages.push({role:'user',content:previous.prompt},{role:'assistant',content:r.text});}}messages.push({role:'user',content:turn.prompt});return messages}
async function runResult(s,turn,r){
 const p=s.models.find(m=>m.id===r.profileId);if(!connected(p)){r.status='error';r.error='이 모델의 API 키가 없어요. 모델 연결에서 다시 입력해 주세요.';updateResult(r);return}
 const controller=new AbortController();controllers.set(r.id,controller);r.status='running';r.text='';r.error='';r.firstMs=null;r.elapsedMs=null;r.usage=null;updateResult(r);let complete=false;
 try{
  const response=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:p.provider,baseURL:p.baseURL,model:p.model,apiKey:keyFor(p)||'',messages:contextFor(s,turn,p),system:s.settings.system,maxTokens:s.settings.maxTokens}),signal:controller.signal});
  if(!response.ok){const e=await response.json().catch(()=>({error:'서버에 연결할 수 없어요.'}));throw Error(e.error||'요청이 실패했어요.')}
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
  const consume=line=>{if(!line.trim())return;const e=JSON.parse(line);if(e.type==='delta')r.text+=e.text;if(e.type==='done'){complete=true;r.firstMs=e.firstMs;r.elapsedMs=e.elapsedMs;r.usage=e.usage;r.finish=e.finish;r.status='done';if(['length','max_tokens'].includes(e.finish))r.error='출력 토큰 한도에 도달해 답변이 잘렸어요. 새 대화의 설정에서 한도를 늘릴 수 있어요.';}if(e.type==='error')throw Error(e.error);updateResult(r)};
  try{while(true){const {value,done}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,i));buffer=buffer.slice(i+1)}if(done){if(buffer)consume(buffer);break}}}finally{try{await reader.cancel()}catch{}reader.releaseLock()}
  if(!complete)throw Error('응답 연결이 중간에 끊겼어요. 다시 시도해 주세요.');
 }catch(e){r.status=controller.signal.aborted?'stopped':'error';r.error=controller.signal.aborted?'응답을 중지했어요.':e.message;}finally{controllers.delete(r.id);updateResult(r);save();}
}
async function send(){
 if(busy)return;const prompt=$('#prompt').value.trim();if(!prompt)return;
 if(!selection.length){notice('먼저 대화할 모델을 선택하세요.');return profiles.length?openPicker():openModels()}
 const selected=selection.map(id=>profile(id)||session()?.models.find(p=>p.id===id));const missing=selected.find(p=>!p||!connected(p));if(missing||selected.some(p=>!p)){notice('선택한 모델의 API 키를 입력해 주세요.');return openModels(missing?.id)}
 let s=session();if(!s){s={id:crypto.randomUUID(),title:prompt.slice(0,35),createdAt:Date.now(),mode,models:selected.map(p=>({...p})),settings:{...settings},turns:[]};sessions.unshift(s);sessions=sessions.slice(0,30);currentId=s.id;}
 if(s.turns.length>=45)return notice('대화가 길어졌어요. 새 대화에서 이어가 주세요.');
 const turn={id:crypto.randomUUID(),prompt,preferred:null,results:s.models.map(p=>({id:crypto.randomUUID(),profileId:p.id,name:p.name,provider:p.provider,model:p.model,status:'running',text:''}))};s.turns.push(turn);$('#prompt').value='';$('#prompt').style.height='auto';$('#welcome').hidden=true;$('#viewLabel').textContent=s.title;setBusy(true);save();renderHistory();renderChips();renderTurns();scrollBottom(true);
 await Promise.allSettled(turn.results.map(r=>runResult(s,turn,r)));setBusy(false);save();renderTurns();$('#prompt').focus();
}
async function retryResult(turn,r){if(busy)return;const p=session().models.find(x=>x.id===r.profileId);if(!connected(p)){notice('API 키를 다시 입력해 주세요.');return openModels(p.id)}setBusy(true);await runResult(session(),turn,r);setBusy(false);renderTurns();}
function resetForm(){ $('#modelForm').reset();$('#editingId').value='';$('#baseField').hidden=true;$('#modelFormTitle').textContent='모델 추가';$('#saveModel').textContent='모델 추가';$('#cancelEdit').hidden=true;$('#connectionStatus').textContent='';$('#modelOptions').replaceChildren();$('#apiKey').placeholder='API 키를 입력하세요'; }
function openModels(id){if(busy)return notice('응답을 먼저 중지해 주세요.');resetForm();renderModelList();if(id&&profile(id)){const p=profile(id);$('#editingId').value=id;$('#provider').value=p.provider;$('#modelName').value=p.name;$('#modelId').value=p.model;$('#baseURL').value=p.baseURL||'';$('#baseField').hidden=p.provider!=='custom';$('#modelFormTitle').textContent='모델 연결 수정';$('#saveModel').textContent='저장';$('#cancelEdit').hidden=false;$('#apiKey').placeholder=keyFor(p)?'등록된 키 유지 · 변경하려면 입력':'API 키를 다시 입력하세요';}showDialog('#modelsDialog');}
function renderModelList(){ $('#modelList').replaceChildren();for(const p of profiles){const row=el('div','modelrow'),info=el('div','modelInfo');info.append(el('strong','',p.name),el('small','',PROVIDERS[p.provider]+' · '+p.model));const state=el('span','keystate'+(!connected(p)?' missing':''),connected(p)?'사용 준비됨':'키 필요');const edit=el('button','','수정');edit.onclick=()=>openModels(p.id);const del=el('button','','삭제');del.onclick=()=>{if(!confirm('이 모델 연결을 삭제할까요? 기존 대화는 남아 있어요.'))return;profiles=profiles.filter(x=>x.id!==p.id);keys.delete(p.id);if(!isActive())selection=selection.filter(x=>x!==p.id);save();resetForm();renderModelList();renderChips();};row.append(el('i','modeldot '+p.provider),info,state,edit,del);$('#modelList').append(row)}}
function openPicker(){if(busy)return;if(!profiles.length)return openModels();if(isActive()){newChat();notice('모델을 변경할 새 대화를 시작했어요.')}renderPicker();showDialog('#pickerDialog')}
function renderPicker(){ $('#pickerHelp').textContent=mode==='chat'?'모델 하나를 선택하세요.':'동시에 비교할 모델을 최대 3개 선택하세요.';$('#pickerList').replaceChildren();for(const p of profiles){const selected=selection.includes(p.id),row=el('button','pickerrow'+(selected?' selected':'')),info=el('span','modelInfo');row.setAttribute('aria-pressed',String(selected));info.append(el('strong','',p.name),el('small','',PROVIDERS[p.provider]+' · '+(connected(p)?p.model:'API 키를 다시 입력해 주세요')));row.append(el('i','modeldot '+p.provider),info,el('span','check',selected?'✓':'＋'));row.onclick=()=>{if(mode==='chat'){selection=[p.id];$('#pickerDialog').close()}else{if(selected)selection=selection.filter(id=>id!==p.id);else{if(selection.length>=3)return notice('한 번에 최대 3개까지 비교할 수 있어요.');selection.push(p.id)}}renderPicker();renderChips();};$('#pickerList').append(row)}}
$('#modelForm').onsubmit=e=>{e.preventDefault();const id=$('#editingId').value,previous=profile(id),provider=$('#provider').value,key=$('#apiKey').value.trim(),baseURL=provider==='custom'?$('#baseURL').value.trim().replace(/\/$/,''):'';
 if(provider==='custom'){try{if(new URL(baseURL).protocol!=='https:')throw Error()}catch{$('#connectionStatus').textContent='공개 HTTPS API 기본 주소를 입력하세요.';return}}
 const sameEndpoint=previous?.provider===provider&&previous?.baseURL===baseURL;
 if(provider!=='custom'&&!key&&!(sameEndpoint&&keyFor(previous))){$('#connectionStatus').textContent='API 키를 입력하세요.';return}
 const p={id:id||crypto.randomUUID(),provider,baseURL,name:$('#modelName').value.trim(),model:$('#modelId').value.trim()};if(!p.name||!p.model){$('#connectionStatus').textContent='표시 이름과 모델 ID를 입력하세요.';return}if(previous)profiles=profiles.map(x=>x.id===id?p:x);else profiles.push(p);
 if(!sameEndpoint)keys.delete(p.id);if(key)keys.set(p.id,{secret:key,provider,baseURL});
 if(!isActive()&&!selection.includes(p.id)&&selection.length<(mode==='chat'?1:3))selection.push(p.id);
 save();resetForm();renderModelList();renderChips();$('#connectionStatus').textContent='저장했어요. 모델을 선택하고 질문을 보내면 실제 연결을 확인할 수 있어요.';};
$('#provider').onchange=()=>{$('#baseField').hidden=$('#provider').value!=='custom';$('#apiKey').value='';$('#modelId').value='';$('#modelOptions').replaceChildren();$('#connectionStatus').textContent='';};
$('#loadModels').onclick=async()=>{const provider=$('#provider').value,previous=profile($('#editingId').value),baseURL=$('#baseURL').value.trim().replace(/\/$/,'');const same=previous?.provider===provider&&(provider!=='custom'||previous?.baseURL===baseURL);const apiKey=$('#apiKey').value.trim()||(same?keyFor(previous):'')||'';$('#loadModels').disabled=true;$('#connectionStatus').textContent='제공업체에서 모델 목록을 불러오고 있어요…';try{const response=await fetch('/api/models',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider,baseURL,apiKey}),signal:AbortSignal.timeout(20000)});const data=await response.json();if(!response.ok)throw Error(data.error);$('#modelOptions').replaceChildren(...data.models.map(m=>{const option=el('option');option.value=m.id;option.label=m.name;return option}));$('#connectionStatus').textContent=`연결 확인됨 · 모델 ${data.models.length}개. 아래 모델 ID 입력창에서 골라 주세요. 텍스트 채팅 지원 여부는 모델마다 달라요.`;}catch(e){$('#connectionStatus').textContent=e.message||'목록을 가져올 수 없어요. 모델 ID를 직접 입력할 수 있어요.';}finally{$('#loadModels').disabled=false;}};
$('#cancelEdit').onclick=resetForm;
$('#manageModels').onclick=()=>openModels();$('#firstConnect').onclick=()=>openModels();$('#selectModels').onclick=openPicker;$('#pickerAdd').onclick=()=>{$('#pickerDialog').close();openModels()};
$('#newChat').onclick=newChat;$('#composer').onsubmit=e=>{e.preventDefault();send()};$('#stopButton').onclick=()=>{for(const controller of controllers.values())controller.abort()};
$('#prompt').oninput=()=>{$('#prompt').style.height='auto';$('#prompt').style.height=Math.min($('#prompt').scrollHeight,160)+'px';};
$('#prompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}});
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{$('#prompt').value=b.dataset.prompt;$('#prompt').focus()});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(busy||mode===b.dataset.mode)return;mode=b.dataset.mode;newChat();renderMode();selection=profiles.slice(0,mode==='chat'?1:3).map(p=>p.id);renderChips()});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{document.getElementById(b.dataset.close).close();$('#apiKey').value='';});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>{$('#apiKey').value=''}));
$('#settingsButton').onclick=()=>{$('#systemPrompt').value=settings.system;$('#maxTokens').value=settings.maxTokens;showDialog('#settingsDialog')};$('#settingsForm').onsubmit=e=>{e.preventDefault();settings={system:$('#systemPrompt').value.trim(),maxTokens:Number($('#maxTokens').value)};save();$('#settingsDialog').close();notice('저장했어요. 다음 새 대화부터 적용돼요.')};
$('#menuToggle').onclick=()=>{document.body.classList.toggle('sidebarOpen');$('#menuToggle').setAttribute('aria-expanded',String(document.body.classList.contains('sidebarOpen')))};
document.addEventListener('click',e=>{if(document.body.classList.contains('sidebarOpen')&&!e.target.closest('#sidebar')&&!e.target.closest('#menuToggle')){document.body.classList.remove('sidebarOpen');$('#menuToggle').setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();newChat()}});
$('#exportChat').onclick=()=>{if(!session())return notice('내보낼 대화를 먼저 시작하세요.');const blob=new Blob([JSON.stringify(session(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='looplab-conversation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
renderHistory();renderMode();renderChips();
