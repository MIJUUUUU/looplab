import test from 'node:test';import assert from 'node:assert/strict';import {makeDB} from '../scripts/local-db.mjs';import {api,dayKey} from '../server/worker.js';
const token=n=>'moyeo_'+n.toString(16).padStart(64,'0');
async function call(db,n,path,data){const req=new Request('https://example.com/api/'+path,{method:data===undefined?'GET':'POST',headers:{'content-type':'application/json',...(n?{authorization:'Bearer '+token(n)}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});const r=await api(req,{DB:db});return {status:r.status,...await r.json()}}
async function setup(capacity=2){const db=makeDB();for(let n=1;n<=8;n++)await call(db,n,'session',{token:token(n),create:true});const room=await call(db,1,'rooms',{name:'민지',nameOfRoom:'우리 방',capacity,hair:0,outfit:0});return {db,room}}
const join=(db,n,code)=>call(db,n,'join',{code,name:'친구'+n,hair:n%4,outfit:n%6});
test('room stays locked until all configured members join; starts exactly at capacity',async()=>{const {db,room}=await setup(6);assert.equal(room.room.started_at,null);for(let n=2;n<6;n++){const s=await join(db,n,room.room.code);assert.equal(s.room.started_at,null)}const locked=await call(db,1,'message',{message:'not yet'});assert.equal(locked.status,409);const full=await join(db,6,room.room.code);assert(full.room.started_at);assert.equal(full.members.length,6);db.close()});
test('concurrent last-slot joins cannot overfill the room',async()=>{const {db,room}=await setup();const results=await Promise.all([join(db,2,room.room.code),join(db,3,room.room.code)]);assert.equal(results.filter(r=>r.status===201).length,1);assert.equal(results.filter(r=>r.status===409).length,1);const s=await call(db,1,'state');assert.equal(s.members.length,2);db.close()});
test('start is persistent, not dependent on online member count',async()=>{const {db,room}=await setup();await join(db,2,room.room.code);db.sqlite.exec('UPDATE members SET seen=0');const s=await call(db,1,'state');assert(s.room.started_at);assert.equal((await call(db,1,'message',{message:'혼자 와도 좋아'})).status,200);db.close()});
test('accounts restore the same character; duplicate join does not create another',async()=>{const {db,room}=await setup();const again=await call(db,1,'session',{token:token(1),create:false});assert.equal(again.members.length,1);assert.equal(again.room.id,room.room.id);assert.equal((await join(db,1,room.room.code)).members.length,1);db.close()});
test('non-members cannot access another room or create events',async()=>{const {db,room}=await setup();await join(db,2,room.room.code);assert.equal((await call(db,3,'state')).room,null);assert.equal((await call(db,3,'events',{title:'leak'})).status,403);assert.equal((await call(db,99,'state')).status,401);db.close()});
test('daily attendance awards coins once, even on repeated requests',async()=>{const {db,room}=await setup();await join(db,2,room.room.code);const rewards=await Promise.all([call(db,1,'checkin',{}),call(db,1,'checkin',{})]);assert.equal(rewards.reduce((a,r)=>a+r.reward,0),10);assert.equal((await call(db,1,'state')).members[0].coins,10);db.close()});
test('attendance day uses Korean midnight',()=>{assert.equal(dayKey(Date.parse('2026-11-13T14:59:59Z')),'2026-11-13');assert.equal(dayKey(Date.parse('2026-11-13T15:00:00Z')),'2026-11-14')});
test('shared event creation, author edit, and optimistic concurrency',async()=>{const {db,room}=await setup();const joined=await join(db,2,room.room.code);const data={title:'영화',date:'2026-11-21',time:'19:30',participants:joined.members.map(m=>m.user_id),note:'함께'};const created=await call(db,2,'events',data);assert.equal(created.events.length,1);const event=created.events[0];assert.equal((await call(db,1,'state')).events[0].title,'영화');assert.equal((await call(db,2,'events',{...data,id:event.id,version:1,title:'산책'})).status,200);assert.equal((await call(db,2,'events',{...data,id:event.id,version:1})).status,409);db.close()});
test('only event author or room owner may delete',async()=>{const {db,room}=await setup(3);await join(db,2,room.room.code);const s=await join(db,3,room.room.code);const c=await call(db,2,'events',{title:'점심',date:'2026-11-20',participants:[s.userId]});const e=c.events[0];assert.equal((await call(db,3,'events/delete',{id:e.id,version:e.version})).status,403);assert.equal((await call(db,1,'events/delete',{id:e.id,version:e.version})).events.length,0);db.close()});
test('event validation rejects invalid dates and outside participants',async()=>{const {db,room}=await setup();const s=await join(db,2,room.room.code);assert.equal((await call(db,1,'events',{title:'x',date:'2026-02-30',participants:[s.userId]})).status,400);assert.equal((await call(db,1,'events',{title:'x',date:'2026-11-20',participants:['outside']})).status,400);db.close()});
test('room decoration conflicts are detected instead of overwriting',async()=>{const {db,room}=await setup();await join(db,2,room.room.code);assert.equal((await call(db,1,'decor',{theme:'sage',furniture:['cat'],revision:0})).room.theme,'sage');assert.equal((await call(db,2,'decor',{theme:'pink',furniture:[],revision:0})).status,409);db.close()});
test('invite rotation invalidates old code and is owner-only',async()=>{const {db,room}=await setup(3);await join(db,2,room.room.code);assert.equal((await call(db,2,'invite',{})).status,403);const changed=await call(db,1,'invite',{});assert.notEqual(changed.room.code,room.room.code);assert.equal((await join(db,3,room.room.code)).status,404);assert.equal((await join(db,3,changed.room.code)).status,201);db.close()});
test('coordinates are bounded and message propagates to another member',async()=>{const {db,room}=await setup();await join(db,2,room.room.code);await call(db,1,'move',{x:900,y:-10});await call(db,1,'message',{message:'안녕 친구들'});const other=await call(db,2,'state');const first=other.members[0];assert.equal(first.x,90);assert.equal(first.y,43);assert.equal(first.message,'안녕 친구들');db.close()});

test('message notifications preserve changes, exclude sender, and persist per-recipient reads',async()=>{
 const {db,room}=await setup(3);await join(db,2,room.room.code);await join(db,3,room.room.code);
 await call(db,1,'message',{message:'첫 인사'});
 await call(db,1,'message',{message:'첫 인사'});
 await call(db,1,'message',{message:'다시 인사'});
 const receiver=await call(db,2,'state');
 assert.equal(receiver.unreadCount,2);
 assert.deepEqual(receiver.notifications.map(n=>n.body),['다시 인사','첫 인사']);
 assert.equal((await call(db,1,'state')).unreadCount,0);
 const id=receiver.notifications[0].id;
 await call(db,3,'notifications/read',{ids:[id]});
 assert.equal((await call(db,2,'state')).unreadCount,2);
 const read=await call(db,2,'notifications/read',{ids:[id]});
 assert.equal(read.unreadCount,1);
 const restored=await call(db,2,'session',{token:token(2),create:false});
 assert(restored.notifications.find(n=>n.id===id).read_at);
 assert.equal((await call(db,3,'state')).unreadCount,2);
 assert.equal((await call(db,4,'notifications/read',{ids:[id]})).status,403);
 await call(db,1,'message',{message:''});
 assert.equal((await call(db,2,'state')).notifications[0].body,'');
 db.close();
});
test('event registration notifies other members with date and title only after successful creation',async()=>{
 const {db,room}=await setup();const joined=await join(db,2,room.room.code);
 const data={title:'저녁 약속',date:'2026-11-21',time:'18:00',participants:[joined.userId]};
 const created=await call(db,1,'events',data);
 const other=await call(db,2,'state');
 assert.equal(other.unreadCount,1);
 assert.equal(other.notifications[0].kind,'event_created');
 assert.equal(other.notifications[0].event_date,data.date);
 assert.equal(other.notifications[0].body,data.title);
 assert.equal(other.notifications[0].target_id,created.events[0].id);
 assert.equal(other.notifications[0].actor_name,'민지');
 assert.equal(created.unreadCount,0);
 await call(db,1,'events',{...data,date:'bad'});
 assert.equal((await call(db,2,'state')).unreadCount,1);
 const outside=await call(db,3,'state');assert.equal(outside.notifications,undefined);
 db.close();
});

test('room notices record editors, reject stale saves, and remain room-scoped',async()=>{
 const {db,room}=await setup();await join(db,2,room.room.code);
 const saved=await call(db,1,'notice',{notice:'토요일 오후에 만나요',revision:0});
 assert.equal(saved.room.notice,'토요일 오후에 만나요');
 assert.equal(saved.room.notice_editor,'민지');
 assert(saved.room.notice_updated_at);
 assert.equal(saved.room.notice_revision,1);
 assert.equal((await call(db,2,'state')).room.notice,saved.room.notice);
 const edited=await call(db,2,'notice',{notice:'일요일에 만나요',revision:1});
 assert.equal(edited.room.notice_editor,'친구2');
 assert.equal(edited.room.notice_revision,2);
 assert.equal((await call(db,1,'notice',{notice:'오래된 수정',revision:1})).status,409);
 assert.equal((await call(db,3,'notice',{notice:'외부 수정',revision:2})).status,403);
 assert.equal((await call(db,1,'notice',{notice:'x'.repeat(201),revision:2})).status,400);
 assert.equal((await call(db,1,'notice',{notice:'잘못된 버전'})).status,400);
 assert.equal((await call(db,1,'notice',{notice:'',revision:2})).room.notice,'');
 db.close();
});

test('photos require a started room, are visible only to room members and do not inflate snapshots',async()=>{
 const {db,room}=await setup();
 // JPEG marker fixture exercises authenticated storage/transport, not image decoding.
 const base64=Buffer.from([255,216,255,224,0,2,255,217]).toString('base64');
 assert.equal((await call(db,1,'photo',{base64})).status,409);
 const joined=await join(db,2,room.room.code);
 const saved=await call(db,1,'photo',{base64,userId:joined.userId});
 assert.equal(saved.status,200);
 const me=saved.members.find(m=>m.user_id===saved.userId);
 assert(me.photo_version);
 assert.equal(saved.members.find(m=>m.user_id===joined.userId).photo_version,null);
 assert(!JSON.stringify(saved).includes(base64));
 const photo=await call(db,2,'photos/'+saved.userId);
 assert.equal(photo.image,'data:image/jpeg;base64,'+base64);
 assert.equal(photo.version,me.photo_version);
 assert.equal((await call(db,3,'photos/'+saved.userId)).status,403);
 assert.equal((await call(db,99,'photos/'+saved.userId)).status,401);
 await call(db,3,'rooms',{name:'외부',nameOfRoom:'다른 방',capacity:2,hair:0,outfit:0});
 assert.equal((await call(db,3,'photos/'+saved.userId)).status,404);
 const receiver=await call(db,2,'state');
 assert.equal(receiver.notifications[0].kind,'photo');
 assert.equal(saved.unreadCount,0);
 await call(db,1,'message',{message:'사진과 함께'});
 const changed=await call(db,1,'photo',{base64});
 assert.notEqual(changed.members[0].photo_version,me.photo_version);
 assert.equal(changed.members[0].message,'사진과 함께');
 assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM member_photos').get().n,1);
 db.close();
});
test('invalid or oversized photos are rejected without notifications',async()=>{
 const {db,room}=await setup();await join(db,2,room.room.code);
 for(const base64 of ['', 'not an image', Buffer.from('not jpeg').toString('base64'),'A'.repeat(1400004)]){
  assert.equal((await call(db,1,'photo',{base64})).status,400);
 }
 assert.equal((await call(db,1,'photo',{base64:'A'.repeat(1450000)})).status,413);
 assert.equal((await call(db,2,'state')).unreadCount,0);
 assert.equal((await call(db,1,'photo',{base64:null})).status,400);
 db.close();
});
