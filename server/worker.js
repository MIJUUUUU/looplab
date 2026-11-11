const PROVIDERS={openai:'https://api.openai.com/v1',anthropic:'https://api.anthropic.com/v1',gemini:'https://generativelanguage.googleapis.com/v1beta/openai',openrouter:'https://openrouter.ai/api/v1'};
const HEADERS={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...HEADERS,'content-type':'application/json'}});
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
function privateAddress(ip){
 if(ip.includes(':'))return !/^2[0-9a-f]{3}:/i.test(ip)&&!/^3[0-9a-f]{3}:/i.test(ip);
 const a=ip.split('.').map(Number);if(a.length!==4||a.some(n=>!Number.isInteger(n)||n<0||n>255))return true;
 return a[0]===0||a[0]===10||a[0]===127||a[0]>=224||(a[0]===169&&a[1]===254)||(a[0]===172&&a[1]>=16&&a[1]<=31)||(a[0]===192&&a[1]===168)||(a[0]===100&&a[1]>=64&&a[1]<=127)||(a[0]===198&&(a[1]===18||a[1]===19));
}
export async function endpointFor(input,fetcher=fetch){
 if(PROVIDERS[input.provider])return PROVIDERS[input.provider];
 if(input.provider!=='custom')throw fail('지원하지 않는 제공업체입니다.');
 let u;try{u=new URL(input.baseURL)}catch{throw fail('올바른 API 기본 주소를 입력하세요.')}
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||(u.port&&u.port!=='443')||u.hostname.includes(':')||!u.hostname.includes('.')||/^\d+(\.\d+){3}$/.test(u.hostname)||/\.(local|internal|localhost|test|invalid)$/i.test(u.hostname))throw fail('공개 도메인의 HTTPS API 주소를 사용하세요. 로컬 주소는 연결할 수 없어요.');
 const results=await Promise.all(['A','AAAA'].map(async type=>{
   const res=await fetcher('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(u.hostname)+'&type='+type,{headers:{accept:'application/dns-json'},signal:AbortSignal.timeout(5000)});
   if(!res.ok)throw fail('API 주소의 DNS를 확인할 수 없어요.');return res.json();
 }));
 const addresses=results.flatMap(r=>(r.Answer||[]).filter(a=>a.type===1||a.type===28).map(a=>a.data));
 if(!addresses.length||addresses.some(privateAddress))throw fail('공개 인터넷에서 접근 가능한 API 주소만 연결할 수 있어요.');
 return u.href.replace(/\/$/,'');
}
function credentials(input){
 if(typeof input.apiKey!=='string'||input.apiKey.length>2000||/[\r\n]/.test(input.apiKey))throw fail('API 키를 확인하세요.');
 if(input.provider!=='custom'&&!input.apiKey.trim())throw fail('모델 연결에서 API 키를 입력하세요.');
 return input.provider==='anthropic'?{'x-api-key':input.apiKey,'anthropic-version':'2023-06-01'}:input.apiKey?{authorization:'Bearer '+input.apiKey}:{};
}
function upstreamError(status){return status===401||status===403?'API 키 또는 모델 접근 권한을 확인하세요.':status===429?'API 사용량 한도 또는 요청 제한에 도달했어요. 잠시 후 다시 시도하세요.':status===404?'모델 ID 또는 API 기본 주소를 확인하세요.':status===400||status===422?'모델이 이 요청 형식을 지원하지 않거나 입력 한도를 초과했어요. 모델 ID와 설정을 확인하세요.':`API 제공업체에서 오류가 발생했어요. (HTTP ${status})`;}
export function payloadFor(input){
 if(typeof input.model!=='string'||!input.model.trim()||input.model.length>200)throw fail('모델 ID를 입력하세요.');
 if(!Array.isArray(input.messages)||!input.messages.length||input.messages.length>100)throw fail('대화가 비어 있거나 너무 길어요. 새 대화를 시작하세요.');
 const messages=input.messages.map(m=>{if(!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>100000)throw fail('올바르지 않은 대화 내용입니다.');return {role:m.role,content:m.content}});
 if(messages.at(-1).role!=='user')throw fail('마지막 메시지는 질문이어야 해요.');
 const system=typeof input.system==='string'?input.system.slice(0,10000):'';
 const limit=Number(input.maxTokens??2048);if(!Number.isInteger(limit)||limit<128||limit>16384)throw fail('출력 토큰은 128~16384 사이로 설정하세요.');
 if(input.provider==='anthropic')return {model:input.model,messages,...(system?{system}:{}),max_tokens:limit,stream:true};
 return {model:input.model,messages:[...(system?[{role:'system',content:system}]:[]),...messages],stream:true,...(input.provider==='openai'?{max_completion_tokens:limit}:{max_tokens:limit}),...(input.provider==='custom'?{}:{stream_options:{include_usage:true}})};
}
export async function* sseEvents(body){
 const reader=body.getReader(),decoder=new TextDecoder();let buffer='',data=[];
 function process(line){if(!line){const joined=data.join('\n');data=[];return joined||null}if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));return null}
 try{while(true){const {value,done}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});let index;while((index=buffer.indexOf('\n'))>=0){let line=buffer.slice(0,index).replace(/\r$/,'');buffer=buffer.slice(index+1);const event=process(line);if(event!==null)yield event;}if(done){if(buffer)process(buffer.replace(/\r$/,''));if(data.length)yield data.join('\n');break;}if(buffer.length>2000000)throw fail('API 응답이 너무 커요.');}}finally{try{await reader.cancel()}catch{}reader.releaseLock()}
}
export function eventData(event,provider){
 if(event.error||event.type==='error')throw fail('모델이 응답 중 오류를 반환했어요. 잠시 후 다시 시도하세요.');
 if(provider==='anthropic'){
  if(event.type==='message_start')return {usage:{input:event.message?.usage?.input_tokens??null,output:event.message?.usage?.output_tokens??null}};
  if(event.type==='content_block_delta'&&event.delta?.type==='text_delta')return {text:event.delta.text};
  if(event.type==='message_delta')return {usage:{output:event.usage?.output_tokens??null},finish:event.delta?.stop_reason};
  if(event.type==='message_stop')return {ended:true};return {};
 }
 const choice=event.choices?.[0],text=choice?.delta?.content||choice?.message?.content||choice?.delta?.refusal;
 return {...(typeof text==='string'?{text}:{}),...(event.usage?{usage:{input:event.usage.prompt_tokens??null,output:event.usage.completion_tokens??null}}:{}),finish:choice?.finish_reason};
}
export async function handleAPI(request,fetcher=fetch){
 const url=new URL(request.url);
 if(request.method!=='POST')return json({error:'POST 요청만 지원해요.'},405);
 if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'다른 사이트에서 요청할 수 없어요.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON 요청이 필요해요.'},415);
 const abort=new AbortController();let timeout;const cancel=()=>abort.abort();request.signal.addEventListener('abort',cancel,{once:true});
 const cleanup=()=>{clearTimeout(timeout);request.signal.removeEventListener('abort',cancel)};
 try{
 const raw=await request.text();if(raw.length>350000)throw fail('대화가 너무 길어요. 새 대화를 시작하세요.',413);
 let input;try{input=JSON.parse(raw)}catch{throw fail('올바른 JSON 요청이 필요해요.')}if(!input||typeof input!=='object')throw fail('요청을 확인하세요.');
 const auth=credentials(input),base=await endpointFor(input,fetcher);
 timeout=setTimeout(cancel,90000);const start=performance.now();
 if(url.pathname==='/api/models'){
   const response=await fetcher(base+'/models',{headers:auth,redirect:'error',signal:abort.signal});
   if(!response.ok)throw fail(upstreamError(response.status),response.status);
   const data=await response.json();const models=(data.data||data.models||[]).map(m=>({id:m.id||m.name?.replace(/^models\//,''),name:m.display_name||m.displayName||m.id||m.name})).filter(m=>typeof m.id==='string').slice(0,600);
   cleanup();return json({models});
 }
 if(url.pathname!=='/api/chat')throw fail('없는 API 경로입니다.',404);
 const payload=payloadFor(input);
 const response=await fetcher(base+(input.provider==='anthropic'?'/messages':'/chat/completions'),{method:'POST',headers:{...auth,'content-type':'application/json',accept:'text/event-stream'},body:JSON.stringify(payload),redirect:'error',signal:abort.signal});
 if(!response.ok)throw fail(upstreamError(response.status),response.status);
 if(!response.body)throw fail('API 응답이 비어 있어요.',502);
 const encoder=new TextEncoder();let cancelled=false;
 const stream=new ReadableStream({
  async start(controller){
   let firstMs=null,hasText=false,finish=null,ended=false;const usage={input:null,output:null};
   const emit=data=>{if(!cancelled)controller.enqueue(encoder.encode(JSON.stringify(data)+'\n'))};
   const consume=event=>{const parsed=eventData(event,input.provider);if(parsed.ended)ended=true;if(parsed.finish){finish=parsed.finish;ended=true}if(parsed.usage)for(const field of ['input','output'])if(Number.isFinite(parsed.usage[field]))usage[field]=parsed.usage[field];if(parsed.text){if(firstMs===null)firstMs=Math.round(performance.now()-start);hasText=true;emit({type:'delta',text:parsed.text})}};
   try{
    if(response.headers.get('content-type')?.includes('application/json')){consume(await response.json());ended=true;}
    else for await(const rawEvent of sseEvents(response.body)){if(rawEvent==='[DONE]'){ended=true;break}let event;try{event=JSON.parse(rawEvent)}catch{throw fail('API 스트림 형식을 읽을 수 없어요.')}consume(event);}
    if(!ended)throw fail('응답 연결이 중간에 끊겼어요. 다시 시도하세요.');
    if(!hasText)throw fail('텍스트 응답이 없어요. 텍스트 채팅을 지원하는 모델인지 확인하거나 출력 토큰을 늘려주세요.');
    emit({type:'done',firstMs,elapsedMs:Math.round(performance.now()-start),usage,finish});
   }catch(e){emit({type:'error',error:abort.signal.aborted?'응답 시간이 90초를 초과했거나 요청이 중지됐어요.':e.status?e.message:'응답을 받는 중 연결이 끊겼어요. 다시 시도하세요.'});}
   finally{cleanup();if(!cancelled)controller.close();}
  },cancel(){cancelled=true;abort.abort();cleanup();}
 });
 return new Response(stream,{headers:{...HEADERS,'content-type':'application/x-ndjson; charset=utf-8','x-accel-buffering':'no'}});
 }catch(e){cleanup();return json({error:abort.signal.aborted?'요청 시간이 초과됐어요. 다시 시도하세요.':e.status?e.message:'API 연결에 실패했어요. 주소와 네트워크를 확인하세요.'},e.status||502);}
}
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/'))return handleAPI(request);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const asset=ASSETS[url.pathname];if(!asset)return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{...HEADERS,'content-type':asset.type,'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'"}});
}};
