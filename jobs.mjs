export const FUNCTION_REGISTRY=Object.freeze([
 {id:"FN-SUPER-DRAIN-ANALYSER",name:"Super Drain analyser",trigger:"inline",status:"REAL"},
 {id:"FN-GITHUB-REUSE-ANALYSER",name:"GitHub reuse analyser",trigger:"governed-worker",status:"PARTIAL"},
 {id:"FN-WORKBOOK-ANALYSER",name:"Workbook analyser",trigger:"drive-worker",status:"PARTIAL"}
]);
export const PRIORITIES=Object.freeze(["normal","urgent","fast-track","emergency"]);
export const TERMINAL_STATES=Object.freeze(["succeeded","failed","cancelled"]);
export function createJob({functionId,priority="normal",source="web",context="",files=[]},now=()=>new Date()){
 if(!FUNCTION_REGISTRY.some(x=>x.id===functionId))throw new Error(`Unknown function: ${functionId}`);
 if(!PRIORITIES.includes(priority))throw new Error(`Unknown priority: ${priority}`);
 const createdAt=now().toISOString(),entropy=globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);
 return{schema:"t4h.super-drain.job.v1",job_id:`job_${createdAt.replace(/\D/g,"")}_${entropy}`,function_id:functionId,priority,source,context,files:files.map(x=>({name:x.name,size:x.size,type:x.type||"application/octet-stream"})),status:"queued",created_at:createdAt,updated_at:createdAt,attempts:0,checkpoint:null,receipt_ref:null,error:null};
}
export function transitionJob(job,next,{receiptRef=null,error=null,checkpoint=null}={},now=()=>new Date()){
 const allowed={queued:["running","paused","cancelled"],running:["paused","succeeded","failed","cancelled"],paused:["queued","cancelled"]};
 if(!(allowed[job.status]||[]).includes(next))throw new Error(`Invalid transition: ${job.status} -> ${next}`);
 return{...job,status:next,updated_at:now().toISOString(),attempts:next==="running"?job.attempts+1:job.attempts,receipt_ref:receiptRef??job.receipt_ref,error,checkpoint:checkpoint??job.checkpoint};
}
export function replayJob(job,now=()=>new Date()){
 if(!TERMINAL_STATES.includes(job.status))throw new Error("Only terminal jobs can be replayed");
 const replay=createJob({functionId:job.function_id,priority:job.priority,source:"replay",context:job.context,files:job.files},now);
 return{...replay,replay_of:job.job_id,checkpoint:job.checkpoint};
}
