import {spawn,spawnSync} from 'node:child_process';
import {networkInterfaces} from 'node:os';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createConnection} from 'node:net';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function portInUse(port){
 return new Promise((resolve,reject)=>{
  const socket=createConnection({host:'127.0.0.1',port});
  socket.once('connect',()=>{socket.destroy();resolve(true)});
  socket.once('error',error=>{socket.destroy();error.code==='ECONNREFUSED'?resolve(false):reject(error)});
  socket.setTimeout(1500,()=>{socket.destroy();reject(new Error(`${port} 포트 확인 시간이 초과됐어요.`))});
 });
}
const args=process.argv.slice(2);
const portIndex=args.indexOf('--port');
const explicitPort=portIndex>=0?args[portIndex+1]:args.find(arg=>arg.startsWith('--port='))?.split('=')[1];
const ports=[4173,...(explicitPort&&Number.isInteger(Number(explicitPort))?[Number(explicitPort)]:[])];
try{
 for(const port of ports)if(await portInUse(port)){
  console.error(`${port} 포트를 이미 사용 중이에요. 실행 중인 개발 서버 터미널에서 Ctrl+C로 종료한 뒤 다시 실행해 주세요. 기존 앱을 새로고침하려면 그 터미널에서 r을 누르세요.`);
  process.exit(1);
 }
}catch(error){console.error(`개발 서버 포트를 확인하지 못했어요: ${error.message}`);process.exit(1)}
const build=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
const interfaces=networkInterfaces();const candidates=[...(interfaces.en0||[]),...Object.values(interfaces).flat().filter(Boolean)];const ip=candidates.find(x=>x.family==='IPv4'&&!x.internal)?.address;
if(!ip){console.error('같은 Wi-Fi에 연결한 뒤 다시 실행해 주세요.');process.exit(1)}
const server=spawn(process.execPath,['scripts/dev.mjs'],{cwd:root,stdio:'inherit'});
const expo=spawn(process.execPath,['node_modules/expo/bin/cli','start',...process.argv.slice(2)],{cwd:root,stdio:'inherit',env:{...process.env,EXPO_PUBLIC_API_URL:`http://${ip}:4173`,EXPO_NO_TELEMETRY:'1'}});
console.log(`두 휴대폰을 같은 Wi-Fi에 연결하세요. 로컬 API: http://${ip}:4173`);
let stopping=false;const stop=()=>{if(stopping)return;stopping=true;server.kill('SIGTERM');expo.kill('SIGTERM')};process.on('SIGINT',stop);process.on('SIGTERM',stop);expo.on('exit',stop);server.on('exit',stop);
