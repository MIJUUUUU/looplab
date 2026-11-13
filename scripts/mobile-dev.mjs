import {spawn,spawnSync} from 'node:child_process';
import {networkInterfaces} from 'node:os';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const build=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
const interfaces=networkInterfaces();const candidates=[...(interfaces.en0||[]),...Object.values(interfaces).flat().filter(Boolean)];const ip=candidates.find(x=>x.family==='IPv4'&&!x.internal)?.address;
if(!ip){console.error('같은 Wi-Fi에 연결한 뒤 다시 실행해 주세요.');process.exit(1)}
const server=spawn(process.execPath,['scripts/dev.mjs'],{cwd:root,stdio:'inherit'});
const expo=spawn(process.execPath,['node_modules/expo/bin/cli','start',...process.argv.slice(2)],{cwd:root,stdio:'inherit',env:{...process.env,EXPO_PUBLIC_API_URL:`http://${ip}:4173`,EXPO_NO_TELEMETRY:'1'}});
console.log(`두 휴대폰을 같은 Wi-Fi에 연결하세요. 로컬 API: http://${ip}:4173`);
let stopping=false;const stop=()=>{if(stopping)return;stopping=true;server.kill('SIGTERM');expo.kill('SIGTERM')};process.on('SIGINT',stop);process.on('SIGTERM',stop);expo.on('exit',stop);server.on('exit',stop);
