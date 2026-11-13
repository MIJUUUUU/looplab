const ASSETS = {"/":{"body":"<!doctype html><html lang=\"ko\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>모여모여 · 우리만의 작은 아지트</title><style>body{background:#f8f6ef;color:#3e4b3a;font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center}main{max-width:420px;padding:40px;text-align:center}b{font-size:56px}h1{font-size:36px;letter-spacing:-2px}p{line-height:1.9;color:#848b79}a{display:inline-block;background:#71845e;color:white;padding:16px 25px;border-radius:20px;text-decoration:none}small{display:block;margin-top:28px;line-height:1.8;color:#959b8a}</style><main><b>🌱</b><h1>모여모여</h1><p>좋아하는 사람들과 함께하는<br>우리만의 작은 도트 아지트.</p><a href=\"moyeo://\">앱 열기</a><small>React Native 앱에서 방을 만들거나<br>친구가 보낸 10자리 초대 코드를 입력해 주세요.<br>모든 멤버가 모이면 우리의 공간이 열려요.</small></main></html>\n","type":"text/html; charset=utf-8"},"/app.js":{"body":"// The experience is a React Native application. See App.tsx.\n","type":"text/javascript; charset=utf-8"},"/style.css":{"body":"/* Native application styles live in src/theme.ts. */\n","type":"text/css; charset=utf-8"}};
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:H});
const error=(message,status=400)=>Object.assign(new Error(message),{status});
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');
const uuid=()=>crypto.randomUUID();
export const dayKey=(now=Date.now())=>new Date(now+9*3600000).toISOString().slice(0,10);
const catalog={plant:{name:'초록 화분',price:20},sofa:{name:'포근한 소파',price:40},rug:{name:'체크 러그',price:30},cat:{name:'잠자는 고양이',price:50},lamp:{name:'작은 스탠드',price:30},flowers:{name:'꽃 한 다발',price:25}};
function text(value,min,max,label){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw error(`${label}은 ${min}~${max}자로 입력해 주세요.`);return value.trim()}
function avatar(b){return {name:text(b.name,1,12,'이름'),hair:Math.max(0,Math.min(3,Math.trunc(Number(b.hair)||0))),outfit:Math.max(0,Math.min(5,Math.trunc(Number(b.outfit)||0)))}}
async function body(req){const raw=await req.text();if(raw.length>16000)throw error('내용이 너무 길어요.',413);try{return JSON.parse(raw)}catch{throw error('요청을 읽을 수 없어요.')}}
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
async function member(db,user){return first(db,'SELECT m.*, r.name AS room_name, r.owner_id, r.capacity, r.started_at, r.code, r.theme, r.furniture, r.revision FROM members m JOIN rooms r ON m.room_id=r.id WHERE m.user_id=?',user)}
async function snapshot(db,user){const m=await member(db,user);if(!m)return {room:null,userId:user,catalog};const room=await first(db,'SELECT * FROM rooms WHERE id=?',m.room_id);const members=await all(db,'SELECT id,user_id,name,hair,outfit,x,y,message,seen,coins,checked_day FROM members WHERE room_id=? ORDER BY rowid',m.room_id);const events=room.started_at?await all(db,'SELECT * FROM events WHERE room_id=? ORDER BY date,time',m.room_id):[];return {userId:user,room:{...room,furniture:JSON.parse(room.furniture)},members,events:events.map(e=>({...e,participants:JSON.parse(e.participants)})),catalog,serverTime:Date.now(),today:dayKey()}}
export async function api(req,env){
 try{
 const db=env.DB;if(!db)throw error('서버 저장소를 준비 중이에요. 잠시 후 다시 시도해 주세요.',503);
 const url=new URL(req.url),path=url.pathname,method=req.method;
 const origin=req.headers.get('origin');if(origin&&origin!==url.origin)throw error('허용되지 않은 요청입니다.',403);
 if(method!=='GET'&&!req.headers.get('content-type')?.includes('application/json'))throw error('JSON 요청이 필요해요.',415);
 if(path==='/api/session'&&method==='POST'){
  const b=await body(req);const token=b.token;
  if(typeof token!=='string'||!/^moyeo_[a-f0-9]{64}$/.test(token))throw error('계정 연결 정보를 확인해 주세요.');
  const hash=await sha(token);let user=await first(db,'SELECT id FROM users WHERE token_hash=?',hash);
  if(!user&&b.create===true){await run(db,'INSERT OR IGNORE INTO users(id,token_hash,created_at) VALUES(?,?,?)',uuid(),hash,Date.now());user=await first(db,'SELECT id FROM users WHERE token_hash=?',hash)}
  if(!user)throw error('복구 코드를 찾을 수 없어요.',401);return json(await snapshot(db,user.id));
 }
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)throw error('앱 계정을 연결해 주세요.',401);
 const user=await first(db,'SELECT id FROM users WHERE token_hash=?',await sha(token));if(!user)throw error('앱 계정을 다시 연결해 주세요.',401);
 if(path==='/api/state'&&method==='GET'){
  await run(db,'UPDATE members SET seen=? WHERE user_id=? AND seen<?',Date.now(),user.id,Date.now()-10000);return json(await snapshot(db,user.id));
 }
 const b=await body(req);let m=await member(db,user.id);
 if(path==='/api/rooms'&&method==='POST'){
  if(m)throw error('이미 참여한 방이 있어요.',409);const p=avatar(b),capacity=Number(b.capacity);if(!Number.isInteger(capacity)||capacity<2||capacity>6)throw error('인원은 2~6명으로 선택해 주세요.');
  const id=uuid(),code=crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase(),name=text(b.nameOfRoom,1,24,'방 이름');
  await db.batch([db.prepare('INSERT INTO rooms(id,code,name,capacity,owner_id,created_at) VALUES(?,?,?,?,?,?)').bind(id,code,name,capacity,user.id,Date.now()),db.prepare('INSERT INTO members(id,user_id,room_id,name,hair,outfit,seen) VALUES(?,?,?,?,?,?,?)').bind(uuid(),user.id,id,p.name,p.hair,p.outfit,Date.now())]);
  return json(await snapshot(db,user.id),201);
 }
 if(path==='/api/join'&&method==='POST'){
  const code=text(b.code,10,10,'초대 코드').toUpperCase();const p=avatar(b);const room=await first(db,'SELECT * FROM rooms WHERE code=?',code);if(!room)throw error('초대 코드를 다시 확인해 주세요.',404);
  if(m){if(m.room_id===room.id)return json(await snapshot(db,user.id));throw error('이미 다른 방에 참여하고 있어요.',409)}
  const result=await run(db,`INSERT INTO members(id,user_id,room_id,name,hair,outfit,x,y,seen) SELECT ?,?,?,?,?,?,35+(SELECT count(*) FROM members WHERE room_id=?)*7,68,? WHERE (SELECT count(*) FROM members WHERE room_id=?) < ?`,uuid(),user.id,room.id,p.name,p.hair,p.outfit,room.id,Date.now(),room.id,room.capacity);
  if(!result.meta.changes)throw error('방의 정원이 이미 찼어요.',409);
  return json(await snapshot(db,user.id),201);
 }
 if(!m)throw error('먼저 방을 만들거나 초대 코드로 참여해 주세요.',403);
 if(path==='/api/profile'&&method==='POST'){const p=avatar(b);await run(db,'UPDATE members SET name=?,hair=?,outfit=? WHERE user_id=?',p.name,p.hair,p.outfit,user.id);return json(await snapshot(db,user.id))}
 if(path==='/api/invite'&&method==='POST'){if(m.owner_id!==user.id)throw error('방장만 초대 코드를 변경할 수 있어요.',403);await run(db,'UPDATE rooms SET code=? WHERE id=?',uuid().replaceAll('-','').slice(0,10).toUpperCase(),m.room_id);return json(await snapshot(db,user.id))}
 if(!m.started_at)throw error('설정한 인원이 모두 모이면 시작할 수 있어요.',409);
 if(path==='/api/move'&&method==='POST'){const x=Number(b.x),y=Number(b.y);if(!Number.isFinite(x)||!Number.isFinite(y))throw error('위치를 확인해 주세요.');await run(db,'UPDATE members SET x=?,y=?,seen=? WHERE user_id=?',Math.max(10,Math.min(90,x)),Math.max(43,Math.min(84,y)),Date.now(),user.id);return json({ok:true})}
 if(path==='/api/message'&&method==='POST'){await run(db,'UPDATE members SET message=? WHERE user_id=?',text(b.message,0,60,'한마디'),user.id);return json(await snapshot(db,user.id))}
 if(path==='/api/checkin'&&method==='POST'){const result=await run(db,'UPDATE members SET coins=coins+10,checked_day=? WHERE user_id=? AND checked_day<>?',dayKey(),user.id,dayKey());return json({...await snapshot(db,user.id),reward:result.meta.changes?10:0})}
 if(path==='/api/decor'&&method==='POST'){
  const revision=Number(b.revision);if(!Number.isInteger(revision))throw error('공간을 다시 불러와 주세요.');
  if(!['cream','sage','pink','night'].includes(b.theme)||!Array.isArray(b.furniture)||b.furniture.some(k=>!catalog[k]))throw error('꾸미기 설정을 확인해 주세요.');
  const result=await run(db,'UPDATE rooms SET theme=?,furniture=?,revision=revision+1 WHERE id=? AND revision=?',b.theme,JSON.stringify([...new Set(b.furniture)].slice(0,6)),m.room_id,revision);if(!result.meta.changes)throw error('친구가 먼저 방을 꾸몄어요. 새 상태를 확인하고 다시 적용해 주세요.',409);return json(await snapshot(db,user.id))
 }
 if(path==='/api/events'&&method==='POST'){
  const title=text(b.title,1,60,'일정 이름'),date=text(b.date,10,10,'날짜'),time=b.time||'',note=text(b.note||'',0,300,'메모');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw error('올바른 날짜를 입력해 주세요.');
  if(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw error('시간은 19:30처럼 입력해 주세요.');
  const participants=b.participants;if(!Array.isArray(participants)||!participants.length||participants.length>6)throw error('참여자를 한 명 이상 선택해 주세요.');const ids=(await all(db,'SELECT user_id FROM members WHERE room_id=?',m.room_id)).map(x=>x.user_id);if(participants.some(id=>!ids.includes(id)))throw error('방의 멤버만 선택할 수 있어요.');
  if(b.id){const event=await first(db,'SELECT * FROM events WHERE id=? AND room_id=?',b.id,m.room_id);if(!event)throw error('일정을 찾을 수 없어요.',404);if(event.author_id!==user.id&&m.owner_id!==user.id)throw error('작성자나 방장만 수정할 수 있어요.',403);const result=await run(db,'UPDATE events SET title=?,date=?,time=?,note=?,participants=?,version=version+1 WHERE id=? AND version=?',title,date,time,note,JSON.stringify(participants),event.id,Number(b.version));if(!result.meta.changes)throw error('다른 사람이 일정을 수정했어요. 다시 열어 주세요.',409)}else{const count=await first(db,'SELECT count(*) AS n FROM events WHERE room_id=?',m.room_id);if(count.n>=500)throw error('일정은 방당 최대 500개까지 저장할 수 있어요.');await run(db,'INSERT INTO events(id,room_id,author_id,title,date,time,note,participants,created_at) VALUES(?,?,?,?,?,?,?,?,?)',uuid(),m.room_id,user.id,title,date,time,note,JSON.stringify([...new Set(participants)]),Date.now())}
  return json(await snapshot(db,user.id));
 }
 if(path==='/api/events/delete'&&method==='POST'){const event=await first(db,'SELECT * FROM events WHERE id=? AND room_id=?',b.id,m.room_id);if(!event)throw error('이미 삭제된 일정이에요.',404);if(event.author_id!==user.id&&m.owner_id!==user.id)throw error('작성자나 방장만 삭제할 수 있어요.',403);const result=await run(db,'DELETE FROM events WHERE id=? AND version=?',event.id,Number(b.version));if(!result.meta.changes)throw error('일정이 변경됐어요. 다시 열어 주세요.',409);return json(await snapshot(db,user.id))}
 throw error('지원하지 않는 요청이에요.',404);
 }catch(e){return json({error:e.status?e.message:'요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'},e.status||500)}
}
export default {async fetch(req,env){const path=new URL(req.url).pathname;if(path.startsWith('/api/'))return api(req,env);if(path==='/health')return json({ok:true,app:'moyeo',database:!!env.DB});const assets=ASSETS;const a=assets[path]||assets['/'];const code=path.match(/^\/invite\/([A-Fa-f0-9]{10})$/)?.[1]?.toUpperCase();const html=code?a.body.replace('href="moyeo://"',`href="moyeo://join?code=${code}"`).replace('<h1>모여모여</h1>',`<h1>함께 모여요</h1><p>초대 코드 <strong>${code}</strong></p>`):a.body;return new Response(html,{headers:{'content-type':a.type,'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'none'; img-src 'self' data:; frame-ancestors 'self' https://chatgpt.com; base-uri 'none'"}})}};
