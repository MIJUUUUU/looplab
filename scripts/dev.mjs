import {createServer} from 'node:http';
import {mkdirSync,readFileSync} from 'node:fs';
import {makeDB} from './local-db.mjs';
mkdirSync('.local',{recursive:true});const DB=makeDB('.local/moyeo.sqlite');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync('dist/server/index.js')).toString('base64'));
createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const request=new Request('http://localhost:4173'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const response=await worker.fetch(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end('Local server error')}}).listen(4173,'0.0.0.0',()=>console.log('API: http://localhost:4173 (use this computer’s LAN IP on your phone)'));
