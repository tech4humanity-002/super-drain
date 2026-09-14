import {readState,writeState} from "./storage.mjs";

const ENDPOINT="https://pflisxkcxbzboxwidywf.supabase.co/rest/v1/t4h_world_events";
const API_KEY="sb_publishable_DgvX25usJPa6TstcFd3_3w_gcRwGc6n";
const SOURCE="super-drain";

async function emitReceipt(receipt){
  if(!receipt?.evidence_hash)return {status:"PARTIAL",reason:"No receipt evidence hash"};
  const sent=await readState("world-runtime-sent-evidence",[]);
  if(sent.includes(receipt.evidence_hash))return {status:"REAL",reason:"Already emitted",evidence_hash:receipt.evidence_hash};
  const batch=receipt.batch||{};
  const event={
    event_id:`super-drain:${batch.batch_id||receipt.evidence_hash}`,
    source:SOURCE,
    subject:batch.batch_id||null,
    event_time:batch.finished_at||new Date().toISOString(),
    observed_at:new Date().toISOString(),
    signal_type:"intake.completed",
    significance:receipt.status==="REAL"?"completed":"partial",
    authority:{status:"UNAUTHORISED",scope:["signal.ingest"]},
    provenance:{source:"super-drain",evidence_hash:receipt.evidence_hash,receipt_schema:receipt.schema||null},
    context:{source_type:batch.source_type||null,selected_files:batch.selected_files||0,expanded_files:batch.expanded_files||0,occurrences_created:batch.occurrences_created||0,cancelled:Boolean(batch.cancelled)},
    correlation_id:batch.batch_id||null,
    status:"PARTIAL"
  };
  const response=await fetch(ENDPOINT,{method:"POST",headers:{"apikey":API_KEY,"content-type":"application/json","prefer":"resolution=ignore-duplicates"},body:JSON.stringify(event)});
  if(!response.ok)return {status:"DEGRADED",code:response.status,reason:await response.text()};
  sent.push(receipt.evidence_hash);
  await writeState("world-runtime-sent-evidence",sent.slice(-500));
  return {status:"PARTIAL",event_id:event.event_id,reason:"Signal ingested; execution authority intentionally not inferred"};
}

function urlsFromDrop(event){
  const dt=event.dataTransfer;
  if(!dt)return [];
  const values=[];
  for(const type of ["text/uri-list","text/plain","text/html"]){
    let value="";
    try{value=dt.getData(type)||""}catch{}
    if(type==="text/uri-list")values.push(...value.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^https?:\/\//i.test(x)));
    else if(type==="text/plain"&&/^https?:\/\/\S+$/i.test(value.trim()))values.push(value.trim());
    else if(type==="text/html"){
      const doc=new DOMParser().parseFromString(value,"text/html");
      values.push(...[...doc.querySelectorAll("a[href]")].map(a=>a.href).filter(x=>/^https?:\/\//i.test(x)));
    }
  }
  return [...new Set(values)];
}

function addDroppedUrls(event){
  const urls=urlsFromDrop(event);
  if(!urls.length)return;
  const input=document.querySelector("#files");
  if(!input)return;
  const dt=new DataTransfer();
  for(const url of urls)dt.items.add(new File([url],`url-${Date.now()}-${dt.items.length+1}.txt`,{type:"text/plain"}));
  try{
    input.files=dt.files;
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }catch(error){
    const context=document.querySelector("#context");
    if(context)context.value=[context.value,...urls].filter(Boolean).join("\n");
  }
}

const drop=document.querySelector("#drop");
if(drop)drop.addEventListener("drop",addDroppedUrls,{capture:false});

let last;
async function poll(){
  try{
    const receipt=await readState("super-drain-receipt",null);
    const key=receipt?.evidence_hash;
    if(key&&key!==last){last=key;const result=await emitReceipt(receipt);await writeState("world-runtime-last-signal",result)}
  }catch(error){await writeState("world-runtime-last-signal",{status:"DEGRADED",reason:error.message})}
}
await poll();
setInterval(()=>void poll(),5000);
