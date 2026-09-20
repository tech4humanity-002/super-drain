import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {DrainStore} from "./store.mjs";
import {buildOuttake} from "./outtake.mjs";
import {buildStateView} from "./state-view.mjs";
import {readJsonBody} from "./http-body.mjs";
const here=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(here,"..");
const root=process.env.DRAIN_RUNTIME_ROOT||path.join(project,".drain-runtime"),port=Number(process.env.PORT||4317),store=new DrainStore(root);
const source=Object.freeze({repository:"tech4humanity-002/super-drain",component:"super-drain",commit_sha:process.env.VERCEL_GIT_COMMIT_SHA||process.env.GIT_COMMIT_SHA||null});
const send=(res,status,value,contentType="application/json")=>{res.writeHead(status,{"content-type":`${contentType}; charset=utf-8`,"cache-control":"no-store"});res.end(contentType==="application/json"?`${JSON.stringify(value,null,2)}\n`:value)};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);
if(req.method==="GET"&&url.pathname==="/health")return send(res,200,{status:"REAL",service:"t4h-super-drain",source,pid:process.pid,runtime_root:root,snapshot:store.snapshot()});
if(req.method==="GET"&&url.pathname==="/api/state"){const itemLimit=Math.min(500,Math.max(0,Number(url.searchParams.get("items")||50)));return send(res,200,{snapshot:store.snapshot(),state:buildStateView(store.read(),{itemLimit})})}
if(req.method==="GET"&&url.pathname==="/api/outtake"){const limit=Math.min(1000,Math.max(1,Number(url.searchParams.get("limit")||200))),evidenceLimit=Math.min(100,Math.max(1,Number(url.searchParams.get("evidenceLimit")||25)));return send(res,200,buildOuttake(store.read(),{limit,evidenceLimit}))}
if(req.method==="POST"&&url.pathname==="/api/ingest")return send(res,202,store.ingest(await readJsonBody(req)));
if(req.method==="POST"&&url.pathname==="/api/auto-advance")return send(res,200,store.autoAdvance());
const relative=url.pathname==="/"?"index.html":url.pathname.replace(/^\/+/, ""),target=path.resolve(project,relative);
if(!target.startsWith(project)||!fs.existsSync(target)||fs.statSync(target).isDirectory())return send(res,404,{error:"not_found"});
const types={".html":"text/html",".css":"text/css",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json"};
return send(res,200,fs.readFileSync(target),types[path.extname(target)]||"application/octet-stream");
}catch(error){return send(res,400,{status:"BLOCKED",error:error.message})}});
server.listen(port,"127.0.0.1",()=>console.log(JSON.stringify({status:"RUNNING",service:"t4h-super-drain",source,port,root,pid:process.pid})));
for(const signal of ["SIGINT","SIGTERM"])process.on(signal,()=>server.close(()=>process.exit(0)));
