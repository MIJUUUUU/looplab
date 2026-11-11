import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const server=createServer(async(req,res)=>{
 const abort=new AbortController();res.on('close',()=>abort.abort());
 try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const request=new Request('http://127.0.0.1:4173'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}:{}),signal:abort.signal});const response=await worker.fetch(request,{},{});res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body){const reader=response.body.getReader();while(true){const {value,done}=await reader.read();if(done)break;res.write(value)}}res.end();}catch{if(!res.headersSent)res.writeHead(500);res.end('Local server error');}
});server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
