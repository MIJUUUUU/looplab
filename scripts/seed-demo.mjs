import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Local development only. Never connects to the hosted database.
const path=fileURLToPath(new URL('../.local/moyeo.sqlite',import.meta.url));
const db=new DatabaseSync(path);
db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
const rooms=db.prepare('SELECT * FROM rooms WHERE started_at IS NULL').all();
if(rooms.length!==1){db.close();throw new Error('대기 중인 로컬 방이 정확히 하나일 때 실행해 주세요.');}
const room=rooms[0];
const backup=path+`.before-demo-${Date.now()}`;
db.prepare('VACUUM INTO ?').run(backup);
const now=Date.now();
const friends=[['모모','오늘도 만나서 반가워!',1,2],['루루','우리 주말에 뭐 할까?',3,4],['하루','잠깐 쉬었다 가자',2,1],['나나','여기 너무 포근해',1,3],['두리','다 같이 놀자!',0,5]];
db.exec('BEGIN IMMEDIATE');
try{
 const count=db.prepare('SELECT count(*) AS n FROM members WHERE room_id=?').get(room.id).n;
 for(let i=count;i<room.capacity;i++){
  const [name,message,hair,outfit]=friends[i-count];
  const user=`demo-${randomUUID()}`;
  db.prepare('INSERT INTO users(id,token_hash,created_at) VALUES(?,?,?)').run(user,`demo-disabled-${randomUUID()}`,now);
  db.prepare('INSERT INTO members(id,user_id,room_id,name,hair,outfit,x,y,message,seen) VALUES(?,?,?,?,?,?,?,?,?,?)').run(randomUUID(),user,room.id,name,hair,outfit,25+i*10,60+(i%2)*12,message,now);
 }
 const participants=JSON.stringify(db.prepare('SELECT user_id FROM members WHERE room_id=?').all(room.id).map(m=>m.user_id));
 for(const [offset,title,time,note] of [[1,'같이 영화 보기','20:00','더미 일정 · 보고 싶은 영화 골라오기'],[3,'주말 카페 모임','14:00','더미 일정 · 맛있는 디저트 먹기']]){
  const date=new Date(now+9*3600000+offset*86400000).toISOString().slice(0,10);
  db.prepare('INSERT INTO events(id,room_id,author_id,title,date,time,note,participants,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(`demo-${randomUUID()}`,room.id,room.owner_id,title,date,time,note,participants,now);
 }
 const result=db.prepare('SELECT started_at FROM rooms WHERE id=?').get(room.id);
 if(!result.started_at)throw new Error('정원 도달 후 시작 처리가 되지 않았습니다.');
 db.exec('COMMIT');
 console.log(`로컬 방에 더미 멤버를 채웠습니다: ${room.capacity}명. 샘플 일정 2개 추가.`);
 console.log(`원본 백업: ${backup}`);
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
