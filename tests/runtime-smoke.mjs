import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const port=43170+Math.floor(Math.random()*100);
const root=await fs.mkdtemp(path.join(os.tmpdir(),"super-drain-runtime-"));
const child=spawn(process.execPath,["src/server.mjs"],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DRAIN_RUNTIME_ROOT:root},stdio:["ignore","pipe","pipe"]});
let output="";
child.stdout.on("data",b=>{output+=b});
child.stderr.on("data",b=>{output+=b});
const base=`http://127.0.0.1:${port}`;
try{
  for(let i=0;i<50;i++){try{const r=await fetch(base+"/health");if(r.ok)break}catch{} await new Promise(r=>setTimeout(r,50))}
  const health=await (await fetch(base+"/health")).json();
  assert.equal(health.status,"REAL"); assert.equal(health.source.repository,"tech4humanity-002/super-drain");
  const ingest=await (await fetch(base+"/api/ingest",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({source_system:"runtime-smoke",source_session:"smoke-1",items:[{occurrence_ref:"smoke:1",title:"Fix production deployment",url:"https://example.com",content:"Fix the production deployment and verify the evidence."}]})})).json();
  assert.equal(ingest.status,"ACKED"); assert.equal(ingest.accepted.length,1); assert.equal(ingest.receipt.readback_verified,true);
  const replay=await (await fetch(base+"/api/ingest",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({source_system:"runtime-smoke",source_session:"smoke-1",items:[{occurrence_ref:"smoke:1",title:"Fix production deployment",url:"https://example.com",content:"Fix the production deployment and verify the evidence."}]})})).json();
  assert.equal(replay.replayed.length,1); assert.equal(replay.accepted.length,0);
  const state=await (await fetch(base+"/api/state?items=50")).json(); assert.equal(state.state.item_window.returned,1); assert.equal(state.state.item_window.total,1);
  const outtake=await (await fetch(base+"/api/outtake?limit=25")).json(); assert.ok(outtake.recovered_work>=1); assert.ok(outtake.work[0].evidence.length>=1);
  const advanced=await (await fetch(base+"/api/auto-advance",{method:"POST",headers:{"content-type":"application/json"},body:"{}"})).json(); assert.equal(advanced.status,"SUCCEEDED"); assert.equal(advanced.advanced,1); assert.ok(advanced.receipt.readback_verified);
  console.log(JSON.stringify({status:"REAL",health:health.status,accepted:ingest.accepted.length,replayed:replay.replayed.length,recovered_work:outtake.recovered_work,advanced:advanced.advanced,receipt_verified:advanced.receipt.readback_verified,output:output.trim()}));
}finally{child.kill("SIGTERM");await new Promise(r=>setTimeout(r,100));await fs.rm(root,{recursive:true,force:true})}
